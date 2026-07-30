import { describe, expect, it } from 'vitest'
import {
  buildMaxValueRoute,
  getValuedMartelliSlots,
  markedValueSlots,
  VALUE_ANCHORS,
} from './maxValueRoute'

describe('maxValueRoute', () => {
  it('marks value on slots near anchors', () => {
    expect(VALUE_ANCHORS.length).toBeGreaterThan(5)
    const valued = getValuedMartelliSlots()
    expect(valued.some((s) => s.value >= 5)).toBe(true)
    expect(markedValueSlots([]).length).toBeGreaterThan(0)
  })

  it('builds a dynamic high-value path from a GPS point', () => {
    const from = { lat: -34.5505, lng: -58.5105 }
    const route = buildMaxValueRoute(from, [], 60)
    expect(route.stops.length).toBeGreaterThan(2)
    expect(route.totalValue).toBeGreaterThan(route.stops.length)
    expect(route.points[0]).toEqual([from.lat, from.lng])
    // greedy should not revisit
    const ids = new Set(route.stops.map((s) => s.id))
    expect(ids.size).toBe(route.stops.length)
  })

  it('skips covered slots', () => {
    const from = { lat: -34.5505, lng: -58.5105 }
    const first = buildMaxValueRoute(from, [], 30)
    const hit = first.stops[0]!
    const again = buildMaxValueRoute(from, [{ lat: hit.lat, lng: hit.lng }], 30)
    expect(again.stops.every((s) => s.id !== hit.id)).toBe(true)
  })
})
