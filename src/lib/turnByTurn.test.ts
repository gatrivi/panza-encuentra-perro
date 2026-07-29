import { describe, expect, it } from 'vitest'
import { POSTER_MODE_DEFAULT } from './posterRoutes'
import {
  advanceIndex,
  cueForPosition,
  flattenRouteNodes,
  relativeTurn,
} from './turnByTurn'

describe('turnByTurn', () => {
  it('flattens default route with poster flags', () => {
    const nodes = flattenRouteNodes(POSTER_MODE_DEFAULT)
    expect(nodes.length).toBeGreaterThan(4)
    expect(nodes.some((n) => n.poster)).toBe(true)
  })

  it('classifies relative turns', () => {
    expect(relativeTurn(0, 90)).toBe('right')
    expect(relativeTurn(0, 270)).toBe('left')
    expect(relativeTurn(10, 15)).toBe('straight')
  })

  it('cues near waypoint with meters', () => {
    const nodes = flattenRouteNodes(POSTER_MODE_DEFAULT)
    const target = nodes[2]!
    // ~60 m south
    const me = { lat: target.lat - 0.00054, lng: target.lng }
    const cue = cueForPosition({
      me,
      headingDeg: 0,
      nodes,
      index: 2,
    })
    expect(cue?.text).toMatch(/metros/)
  })
})
