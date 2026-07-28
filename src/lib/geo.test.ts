import { describe, expect, it } from 'vitest'
import {
  bearingDeg,
  cardinalFromBearing,
  formatDistanceM,
  haversineM,
} from './geo'

describe('geo', () => {
  it('haversine ≈ 0 for same point', () => {
    const p = { lat: -34.5633, lng: -58.5152 }
    expect(haversineM(p, p)).toBeLessThan(0.01)
  })

  it('haversine Constituyentes→Shell ~130 m', () => {
    const a = { lat: -34.5633, lng: -58.5152 }
    const b = { lat: -34.5643, lng: -58.5145 }
    const d = haversineM(a, b)
    expect(d).toBeGreaterThan(100)
    expect(d).toBeLessThan(200)
  })

  it('bearing + cardinal point SE-ish', () => {
    const from = { lat: -34.5633, lng: -58.5152 }
    const to = { lat: -34.5643, lng: -58.5145 }
    const b = bearingDeg(from, to)
    expect(b).toBeGreaterThan(90)
    expect(b).toBeLessThan(180)
    expect(['E', 'SE', 'S']).toContain(cardinalFromBearing(b))
  })

  it('formatDistanceM', () => {
    expect(formatDistanceM(42)).toBe('42 m')
    expect(formatDistanceM(1500)).toBe('1.5 km')
  })
})
