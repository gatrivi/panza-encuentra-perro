import { describe, expect, it } from 'vitest'
import {
  buildTocaRiesgoCache,
  cellsAlongPath,
  coverageFade,
  interpolatePoints,
  mergeAvoidGeometry,
  pointToCell,
  sugerirCarteles,
  sweptToPolygon,
  tocaRiesgo,
  zonaYaPeinada,
  type HexState,
} from './h3Coverage'
import type { AvoidArea } from '@/domain/schemas'

const CENTER: [number, number] = [-58.508, -34.551]

describe('h3Coverage', () => {
  it('pointToCell is stable', () => {
    expect(pointToCell(CENTER)).toMatch(/^[0-9a-f]+$/i)
    expect(pointToCell(CENTER)).toBe(pointToCell(CENTER))
  })

  it('interpolatePoints fills gaps', () => {
    const a: [number, number] = [-58.5, -34.55]
    const b: [number, number] = [-58.505, -34.555]
    const pts = interpolatePoints(a, b, 40)
    expect(pts.length).toBeGreaterThan(1)
    expect(pts.at(-1)).toEqual(b)
  })

  it('cellsAlongPath returns cells', () => {
    const cells = cellsAlongPath([
      [-58.5, -34.55],
      [-58.502, -34.552],
      [-58.504, -34.554],
    ])
    expect(cells.length).toBeGreaterThanOrEqual(1)
  })

  it('sweptToPolygon builds GeoJSON', () => {
    const cell = pointToCell(CENTER)
    const poly = sweptToPolygon([cell])
    expect(poly?.type).toBe('Polygon')
    expect(poly?.coordinates[0]?.length).toBeGreaterThanOrEqual(4)
  })

  it('coverageFade decays with age', () => {
    const now = Date.now()
    expect(coverageFade(new Date(now), now)).toBe(1)
    expect(coverageFade(new Date(now - 48 * 3600_000), now)).toBe(0.5)
    expect(coverageFade(new Date(now - 200 * 3600_000), now)).toBe(0.15)
  })

  it('zonaYaPeinada checks cell + ring', () => {
    const cell = pointToCell(CENTER)
    const peinados = new Set([cell])
    expect(zonaYaPeinada(CENTER, peinados)).toBe(true)
    expect(zonaYaPeinada([-58.6, -34.7], peinados)).toBe(false)
  })

  it('tocaRiesgo / sugerirCarteles prioritize perimeter', () => {
    const cell = pointToCell(CENTER)
    const poly = sweptToPolygon([cell])!
    const area: AvoidArea = {
      id: 'a1',
      caseId: 'c',
      name: 'test',
      geometry: poly,
      reason: null,
      active: true,
      createdByUid: 'u',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    expect(tocaRiesgo(cell, [area])).toBe(true)

    const neighborCells = cellsAlongPath([
      CENTER,
      [CENTER[0] + 0.002, CENTER[1] + 0.002],
      [CENTER[0] + 0.01, CENTER[1] + 0.01],
    ])
    const touching = buildTocaRiesgoCache([area], neighborCells)
    const hexes = new Map<string, HexState>()
    for (const id of neighborCells) {
      hexes.set(id, { status: 'walked', updatedAt: new Date() })
    }
    const suggested = sugerirCarteles(neighborCells, touching, hexes)
    expect(suggested.every((id) => !touching.has(id))).toBe(true)
  })

  it('mergeAvoidGeometry unions overlapping polys', () => {
    const a = sweptToPolygon([pointToCell(CENTER)])!
    const b = sweptToPolygon([
      pointToCell([CENTER[0] + 0.001, CENTER[1] + 0.001]),
    ])!
    const merged = mergeAvoidGeometry(a, b)
    expect(merged.type).toBe('Polygon')
    expect(merged.coordinates[0]!.length).toBeGreaterThanOrEqual(4)
  })
})
