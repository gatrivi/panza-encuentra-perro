import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const input = resolve(process.argv[2] ?? '/tmp/florida-martelli-overpass.json')
const outputDir = resolve(process.argv[3] ?? 'public/map')
const bounds = {
  south: -34.557,
  west: -58.534,
  north: -34.528,
  east: -58.496,
}

const MAIN = new Set([
  'motorway',
  'motorway_link',
  'trunk',
  'trunk_link',
  'primary',
  'primary_link',
  'secondary',
  'secondary_link',
  'tertiary',
  'tertiary_link',
])

function sqDistance(a, b) {
  const dx = a[0] - b[0]
  const dy = a[1] - b[1]
  return dx * dx + dy * dy
}

function sqSegmentDistance(point, start, end) {
  let x = start[0]
  let y = start[1]
  let dx = end[0] - x
  let dy = end[1] - y

  if (dx !== 0 || dy !== 0) {
    const t =
      ((point[0] - x) * dx + (point[1] - y) * dy) /
      (dx * dx + dy * dy)
    if (t > 1) {
      x = end[0]
      y = end[1]
    } else if (t > 0) {
      x += dx * t
      y += dy * t
    }
  }

  dx = point[0] - x
  dy = point[1] - y
  return dx * dx + dy * dy
}

function simplifyStep(points, first, last, toleranceSq, keep) {
  let max = toleranceSq
  let index = 0
  for (let i = first + 1; i < last; i += 1) {
    const distance = sqSegmentDistance(points[i], points[first], points[last])
    if (distance > max) {
      index = i
      max = distance
    }
  }
  if (max > toleranceSq) {
    if (index - first > 1) simplifyStep(points, first, index, toleranceSq, keep)
    keep.push(points[index])
    if (last - index > 1) simplifyStep(points, index, last, toleranceSq, keep)
  }
}

function simplify(points, tolerance) {
  if (points.length <= 2) return points
  const toleranceSq = tolerance * tolerance
  const radial = [points[0]]
  let previous = points[0]
  for (let i = 1; i < points.length; i += 1) {
    const point = points[i]
    if (sqDistance(point, previous) > toleranceSq) {
      radial.push(point)
      previous = point
    }
  }
  if (previous !== points.at(-1)) radial.push(points.at(-1))
  if (radial.length <= 2) return radial

  const keep = [radial[0]]
  simplifyStep(radial, 0, radial.length - 1, toleranceSq, keep)
  keep.push(radial.at(-1))
  return keep
}

function round(value) {
  return Number(value.toFixed(6))
}

function featureFor(element, tolerance) {
  if (!Array.isArray(element.geometry) || element.geometry.length < 2) return null
  const tags = element.tags ?? {}
  const kind = tags.railway ? 'rail' : 'road'
  const roadClass = tags.highway ?? tags.railway ?? 'unknown'
  const coordinates = simplify(
    element.geometry.map((point) => [point.lon, point.lat]),
    tolerance,
  ).map(([lng, lat]) => [round(lng), round(lat)])

  return {
    type: 'Feature',
    properties: {
      id: element.id,
      kind,
      class: roadClass,
      ...(tags.name ? { name: tags.name } : {}),
      ...(tags.ref ? { ref: tags.ref } : {}),
      ...(tags.oneway ? { oneway: tags.oneway } : {}),
    },
    geometry: { type: 'LineString', coordinates },
  }
}

function collection(elements, predicate, tolerance) {
  return {
    type: 'FeatureCollection',
    bbox: [bounds.west, bounds.south, bounds.east, bounds.north],
    features: elements
      .filter(predicate)
      .map((element) => featureFor(element, tolerance))
      .filter(Boolean),
  }
}

function project([lng, lat], width, height) {
  const x = ((lng - bounds.west) / (bounds.east - bounds.west)) * width
  const y = ((bounds.north - lat) / (bounds.north - bounds.south)) * height
  return [Number(x.toFixed(1)), Number(y.toFixed(1))]
}

function pathFor(feature, width, height) {
  return feature.geometry.coordinates
    .map((point, index) => {
      const [x, y] = project(point, width, height)
      return `${index === 0 ? 'M' : 'L'}${x} ${y}`
    })
    .join(' ')
}

function widthFor(roadClass) {
  if (roadClass.startsWith('motorway') || roadClass.startsWith('trunk')) return 4.4
  if (roadClass.startsWith('primary')) return 3.6
  if (roadClass.startsWith('secondary')) return 3
  if (roadClass.startsWith('tertiary')) return 2.4
  return 1.5
}

function previewSvg(streets) {
  const width = 760
  const height = 704
  const roads = streets.features.filter((feature) => feature.properties.kind === 'road')
  const rails = streets.features.filter((feature) => feature.properties.kind === 'rail')
  const roadPaths = roads
    .map((feature) => {
      const d = pathFor(feature, width, height)
      const strokeWidth = widthFor(feature.properties.class)
      return `<path d="${d}" stroke-width="${strokeWidth}"/>`
    })
    .join('')
  const casings = roads
    .map((feature) => {
      const d = pathFor(feature, width, height)
      const strokeWidth = widthFor(feature.properties.class) + 1.5
      return `<path d="${d}" stroke-width="${strokeWidth}"/>`
    })
    .join('')
  const railPaths = rails
    .map(
      (feature) =>
        `<path d="${pathFor(feature, width, height)}" stroke-width="2.2"/>`,
    )
    .join('')

  const labels = []
  const seen = new Set()
  for (const feature of roads) {
    const name = feature.properties.name
    if (!name || seen.has(name) || !MAIN.has(feature.properties.class)) continue
    const coordinates = feature.geometry.coordinates
    const middle = coordinates[Math.floor(coordinates.length / 2)]
    const [x, y] = project(middle, width, height)
    labels.push(
      `<text x="${x}" y="${y}" transform="rotate(-8 ${x} ${y})">${escapeXml(name)}</text>`,
    )
    seen.add(name)
    if (labels.length >= 14) break
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Calles de Florida y Villa Martelli">
<rect width="100%" height="100%" fill="#e9e5da"/>
<g fill="none" stroke="#c8c1b4" stroke-linecap="round" stroke-linejoin="round">${casings}</g>
<g fill="none" stroke="#fffdf8" stroke-linecap="round" stroke-linejoin="round">${roadPaths}</g>
<g fill="none" stroke="#4a514c" stroke-dasharray="6 5" stroke-linecap="round">${railPaths}</g>
<g fill="#405148" font-family="system-ui,sans-serif" font-size="8" font-weight="700" paint-order="stroke" stroke="#fffdf8" stroke-width="2">${labels.join('')}</g>
<text x="${width - 8}" y="${height - 9}" text-anchor="end" fill="#596159" font-family="system-ui,sans-serif" font-size="8">© OpenStreetMap contributors</text>
</svg>`
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

const raw = JSON.parse(readFileSync(input, 'utf8'))
const elements = raw.elements.filter(
  (element) => element.type === 'way' && Array.isArray(element.geometry),
)
const overview = collection(
  elements,
  (element) => Boolean(element.tags?.railway || MAIN.has(element.tags?.highway)),
  0.00006,
)
const streets = collection(elements, () => true, 0.000025)
const detail = collection(elements, () => true, 0.000008)

mkdirSync(outputDir, { recursive: true })
const outputs = [
  ['florida-martelli-overview.geojson', overview],
  ['florida-martelli-streets.geojson', streets],
  ['florida-martelli-detail.geojson', detail],
  [
    'florida-martelli.meta.json',
    {
      source: 'OpenStreetMap via Overpass API',
      license: 'ODbL 1.0',
      attribution: '© OpenStreetMap contributors',
      generatedAt: new Date().toISOString(),
      osmTimestamp: raw.osm3s?.timestamp_osm_base ?? null,
      bounds,
      counts: {
        sourceWays: elements.length,
        overview: overview.features.length,
        streets: streets.features.length,
        detail: detail.features.length,
      },
    },
  ],
]

for (const [name, value] of outputs) {
  writeFileSync(resolve(outputDir, name), `${JSON.stringify(value)}\n`)
}
writeFileSync(
  resolve(outputDir, 'florida-martelli-preview.svg'),
  previewSvg(streets),
)

for (const [name] of outputs) {
  const path = resolve(outputDir, name)
  console.log(path)
}
console.log(resolve(outputDir, 'florida-martelli-preview.svg'))
