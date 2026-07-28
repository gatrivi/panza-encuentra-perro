import { describe, expect, it, vi, afterEach } from 'vitest'
import { cattsBaseUrl } from './catts'

describe('catts', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('defaults to Tailscale catts host', () => {
    expect(cattsBaseUrl()).toBe('http://100.87.252.18:59200')
  })

  it('strips trailing slash from VITE_CATTS_URL', () => {
    vi.stubEnv('VITE_CATTS_URL', 'http://example.test:59200/')
    expect(cattsBaseUrl()).toBe('http://example.test:59200')
  })
})
