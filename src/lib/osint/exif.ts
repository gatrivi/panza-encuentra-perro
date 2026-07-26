/** Client-side EXIF GPS extraction — no upload, privacy-first (Refloow-Geo-Forensics pattern). */

export type ExifResult = {
  hasGps: boolean
  lat?: number
  lng?: number
  takenAt?: Date
  camera?: string
  warnings: string[]
}

function parseRationalPair(values: number[]): number | undefined {
  if (values.length < 2 || values[1] === 0) return undefined
  return values[0] / values[1]
}

function dmsToDecimal(
  dms: number[],
  ref: string,
): number | undefined {
  if (dms.length < 3) return undefined
  const deg = parseRationalPair([dms[0], 1]) ?? dms[0]
  const min = parseRationalPair([dms[1], 1]) ?? dms[1]
  const sec = parseRationalPair([dms[2], 1]) ?? dms[2]
  let decimal = deg + min / 60 + sec / 3600
  if (ref === 'S' || ref === 'W') decimal *= -1
  return decimal
}

/** Minimal JPEG EXIF parser — GPS IFD only. ponytail: not full exiftool. */
export async function extractExifGps(file: File): Promise<ExifResult> {
  const warnings: string[] = []
  if (!file.type.startsWith('image/')) {
    return { hasGps: false, warnings: ['No es imagen'] }
  }

  const buf = await file.arrayBuffer()
  const view = new DataView(buf)
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) {
    return { hasGps: false, warnings: ['No es JPEG válido'] }
  }

  let offset = 2
  let exifStart = -1

  while (offset < view.byteLength - 4) {
    if (view.getUint8(offset) !== 0xff) break
    const marker = view.getUint8(offset + 1)
    const len = view.getUint16(offset + 2)
    if (marker === 0xe1) {
      const sig = String.fromCharCode(
        view.getUint8(offset + 4),
        view.getUint8(offset + 5),
        view.getUint8(offset + 6),
        view.getUint8(offset + 7),
      )
      if (sig === 'Exif') exifStart = offset + 10
      break
    }
    offset += 2 + len
  }

  if (exifStart < 0) {
    return { hasGps: false, warnings: ['Sin bloque EXIF'] }
  }

  const tiff = exifStart
  const le = view.getUint16(tiff) === 0x4949
  const u16 = (o: number) => view.getUint16(o, le)
  const u32 = (o: number) => view.getUint32(o, le)

  const ifd0 = tiff + u32(tiff + 4)
  const entries = u16(ifd0)
  let gpsIfdPtr = 0
  let dateTime: string | undefined
  let make: string | undefined

  for (let i = 0; i < entries; i++) {
    const e = ifd0 + 2 + i * 12
    const tag = u16(e)
    const type = u16(e + 2)
    const count = u32(e + 4)
    const valOff = e + 8

    if (tag === 0x8825) gpsIfdPtr = u32(valOff)
    if (tag === 0x0132 && type === 2) {
      const strOff = count > 4 ? tiff + u32(valOff) : valOff
      dateTime = ''
      for (let j = 0; j < count - 1; j++) {
        dateTime += String.fromCharCode(view.getUint8(strOff + j))
      }
    }
    if (tag === 0x010f && type === 2) {
      const strOff = count > 4 ? tiff + u32(valOff) : valOff
      make = ''
      for (let j = 0; j < count - 1; j++) {
        make += String.fromCharCode(view.getUint8(strOff + j))
      }
    }
  }

  if (!gpsIfdPtr) {
    return {
      hasGps: false,
      takenAt: dateTime ? new Date(dateTime.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')) : undefined,
      camera: make,
      warnings: ['EXIF sin GPS — usar búsqueda inversa de imagen'],
    }
  }

  const gpsIfd = tiff + gpsIfdPtr
  const gpsEntries = u16(gpsIfd)
  let latDms: number[] = []
  let lngDms: number[] = []
  let latRef = 'N'
  let lngRef = 'E'

  for (let i = 0; i < gpsEntries; i++) {
    const e = gpsIfd + 2 + i * 12
    const tag = u16(e)
    const type = u16(e + 2)
    const count = u32(e + 4)
    const dataOff = count > 1 || type === 5 ? tiff + u32(e + 8) : e + 8

    if (tag === 1) latRef = String.fromCharCode(view.getUint8(dataOff))
    if (tag === 3) lngRef = String.fromCharCode(view.getUint8(dataOff))
    if (tag === 2 && type === 5) {
      latDms = []
      for (let j = 0; j < 3; j++) {
        latDms.push(u32(dataOff + j * 8) / u32(dataOff + j * 8 + 4))
      }
    }
    if (tag === 4 && type === 5) {
      lngDms = []
      for (let j = 0; j < 3; j++) {
        lngDms.push(u32(dataOff + j * 8) / u32(dataOff + j * 8 + 4))
      }
    }
  }

  const lat = dmsToDecimal(latDms, latRef)
  const lng = dmsToDecimal(lngDms, lngRef)

  if (lat === undefined || lng === undefined) {
    return { hasGps: false, warnings: ['GPS EXIF corrupto'] }
  }

  return {
    hasGps: true,
    lat,
    lng,
    takenAt: dateTime ? new Date(dateTime.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')) : undefined,
    camera: make,
    warnings,
  }
}
