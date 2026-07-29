import {
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = resolve(process.cwd())
const mapDir = resolve(root, process.argv[2] ?? 'public/map')
const sourcePath = resolve(mapDir, 'florida-martelli-preview.svg')
const metadataPath = resolve(mapDir, 'florida-martelli.meta.json')
const width = 2500
const height = 2316
const tileCount = 5
const tileWidth = width / tileCount
const temp = mkdtempSync(resolve(tmpdir(), 'panza-map-'))

function run(args) {
  const result = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
    stdio: 'inherit',
  })
  if (result.status !== 0) {
    throw new Error(`ffmpeg failed: ${args.join(' ')}`)
  }
}

try {
  const source = readFileSync(sourcePath, 'utf8').replace(
    '<svg ',
    `<svg width="${width}" height="${height}" `,
  )
  const scaledSvg = resolve(temp, 'map.svg')
  const fullPng = resolve(temp, 'map.png')
  writeFileSync(scaledSvg, source)
  run(['-i', scaledSvg, '-frames:v', '1', fullPng])

  const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'))
  const { bounds } = metadata
  const longitudeStep = (bounds.east - bounds.west) / tileCount
  const rasterTiles = []

  for (let index = 0; index < tileCount; index += 1) {
    const number = String(index + 1).padStart(2, '0')
    const name = `florida-martelli-${number}-v1.jpg`
    const output = resolve(mapDir, name)
    run([
      '-i',
      fullPng,
      '-vf',
      `crop=${tileWidth}:${height}:${index * tileWidth}:0`,
      '-frames:v',
      '1',
      '-q:v',
      '2',
      output,
    ])
    rasterTiles.push({
      name,
      width: tileWidth,
      height,
      bytes: statSync(output).size,
      bounds: {
        south: bounds.south,
        west: Number((bounds.west + longitudeStep * index).toFixed(7)),
        north: bounds.north,
        east: Number((bounds.west + longitudeStep * (index + 1)).toFixed(7)),
      },
    })
  }

  writeFileSync(
    metadataPath,
    `${JSON.stringify({ ...metadata, rasterTiles })}\n`,
  )
  console.log(
    rasterTiles
      .map((tile) => `${tile.name} ${tile.bytes} bytes`)
      .join('\n'),
  )
} finally {
  rmSync(temp, { recursive: true, force: true })
}
