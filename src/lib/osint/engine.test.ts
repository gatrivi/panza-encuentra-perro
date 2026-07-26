import { describe, expect, it } from 'vitest'
import { generatePanzaDorks } from './dorks'
import { extractIntelFromText, analyzeCorridor } from './engine'

describe('generatePanzaDorks', () => {
  it('produces facebook and instagram dorks', () => {
    const dorks = generatePanzaDorks({ name: 'Panza' })
    expect(dorks.length).toBeGreaterThanOrEqual(10)
    expect(dorks.some((d) => d.target === 'facebook')).toBe(true)
    expect(dorks.some((d) => d.query.includes('Panza'))).toBe(true)
  })
})

describe('extractIntelFromText', () => {
  it('finds phones and locations in spanish posts', () => {
    const hits = extractIntelFromText(
      'La vi en banquina Gral Paz cerca Parque Sarmiento. Llamar 1156194761',
    )
    expect(hits.some((h) => h.title.includes('Teléfonos'))).toBe(true)
    expect(hits.some((h) => h.title.includes('Ubicaciones'))).toBe(true)
  })
})

describe('analyzeCorridor', () => {
  it('detects movement vector', () => {
    const insights = analyzeCorridor([
      {
        point: [-58.52, -34.57],
        observedAt: new Date('2026-07-23'),
        label: 'Gral Paz',
      },
      {
        point: [-58.515, -34.563],
        observedAt: new Date('2026-07-26'),
        label: 'Constituyentes',
      },
    ])
    expect(insights.some((i) => i.label === 'Vector de movimiento')).toBe(true)
  })
})
