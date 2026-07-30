import { describe, expect, it, beforeEach } from 'vitest'
import {
  disabledPoiIds,
  effectiveValueAnchors,
  listPois,
  POI_CATALOG,
  resetPoiOverrides,
  setPoiOn,
  setPoiWeight,
} from './poiCatalog'

describe('poiCatalog', () => {
  beforeEach(() => {
    resetPoiOverrides()
  })

  it('lists catalog with defaults on', () => {
    const list = listPois()
    expect(list.length).toBe(POI_CATALOG.length)
    expect(list.every((p) => p.on)).toBe(true)
    expect(list[0]!.w).toBeGreaterThanOrEqual(list.at(-1)!.w)
  })

  it('disabling removes from effective anchors', () => {
    const id = POI_CATALOG[0]!.id
    setPoiOn(id, false)
    expect(disabledPoiIds().has(id)).toBe(true)
    expect(effectiveValueAnchors().some((a) => a.id === id)).toBe(false)
  })

  it('weight override sticks', () => {
    const id = POI_CATALOG[0]!.id
    setPoiWeight(id, 3)
    expect(listPois().find((p) => p.id === id)?.w).toBe(3)
  })
})
