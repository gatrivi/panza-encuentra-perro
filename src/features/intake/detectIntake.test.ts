import { describe, expect, it } from 'vitest'
import { detectIntake } from './detectIntake'

describe('detectIntake', () => {
  it('detects bare URL', () => {
    const r = detectIntake.fromValues({
      text: 'https://www.facebook.com/groups/x/posts/123',
    })
    expect(r.sourceUrl).toContain('facebook.com')
    expect(r.rawText).toBeUndefined()
  })

  it('splits URL embedded in text', () => {
    const r = detectIntake.fromValues({
      text: 'Vieron un caniche negro https://fb.com/p/1 cerca de Maipú',
    })
    expect(r.sourceUrl).toBe('https://fb.com/p/1')
    expect(r.rawText).toContain('Maipú')
  })

  it('keeps plain text', () => {
    const r = detectIntake.fromValues({ text: 'Caniche en San Ramón y Maipú' })
    expect(r.rawText).toContain('San Ramón')
    expect(r.sourceUrl).toBeUndefined()
  })
})
