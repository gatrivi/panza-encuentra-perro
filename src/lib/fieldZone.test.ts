import { describe, expect, it } from 'vitest'
import { ACTIVE_FIELD_ZONE, inActiveFieldZone } from './fieldZone'

describe('fieldZone', () => {
  it('hardcodes Zona Norte with Núñez and VL barrios', () => {
    expect(ACTIVE_FIELD_ZONE.id).toBe('zona-norte')
    expect(ACTIVE_FIELD_ZONE.barrios).toContain('Núñez')
    expect(ACTIVE_FIELD_ZONE.barrios).toContain('Olivos')
    expect(ACTIVE_FIELD_ZONE.barrios).toContain('Villa Martelli')
  })

  it('includes Núñez / Roca and rejects far CABA', () => {
    expect(inActiveFieldZone(-34.545, -58.462)).toBe(true) // Núñez
    expect(inActiveFieldZone(-34.53944, -58.508577)).toBe(true) // Roca×vías
    expect(inActiveFieldZone(-34.6037, -58.3816)).toBe(false) // Obelisco
  })
})
