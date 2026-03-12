import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import type { RateLimitConfig } from '../config'

// ─── Mock Redis com pipeline encadeável ────────────────────────────────────────
// Sobrescreve o mock global do setup.ts

const mockExec = vi.fn()

const mockPipeline = {
  zremrangebyscore: vi.fn().mockReturnThis(),
  zcard: vi.fn().mockReturnThis(),
  zadd: vi.fn().mockReturnThis(),
  expire: vi.fn().mockReturnThis(),
  exec: mockExec,
}

vi.mock('@/lib/redis', () => ({
  redis: {
    pipeline: () => mockPipeline,
  },
}))

// Desfaz o mock global do rate-limit para testar a implementação real
vi.unmock('@/lib/rate-limit')

// Importa depois dos mocks
const { rateLimit } = await import('../index')

// ─── Helpers ────────────────────────────────────────────────────────────────────

function makeRequest(ip?: string): NextRequest {
  const headers = new Headers()
  if (ip) headers.set('x-forwarded-for', ip)
  return new NextRequest('http://localhost:3000/api/test', { headers })
}

const defaultConfig: RateLimitConfig = { window: 60, max: 10 }

// ─── Testes ─────────────────────────────────────────────────────────────────────

describe('rateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna null quando requisição está dentro do limite', async () => {
    // ZCARD retorna 5 (abaixo do max 10)
    mockExec.mockResolvedValueOnce([
      [null, 0],   // zremrangebyscore
      [null, 5],   // zcard → count = 5
      [null, 1],   // zadd
      [null, 1],   // expire
    ])

    const req = makeRequest('192.168.1.1')
    const result = await rateLimit(req, 'auth/login', defaultConfig)

    expect(result).toBeNull()
    expect(mockPipeline.zremrangebyscore).toHaveBeenCalledOnce()
    expect(mockPipeline.zcard).toHaveBeenCalledOnce()
    expect(mockPipeline.zadd).toHaveBeenCalledOnce()
    expect(mockPipeline.expire).toHaveBeenCalledOnce()
  })

  it('retorna 429 com Retry-After quando limite é excedido', async () => {
    // ZCARD retorna 10 (igual ao max 10 → bloqueado)
    mockExec.mockResolvedValueOnce([
      [null, 0],    // zremrangebyscore
      [null, 10],   // zcard → count = 10 (>= max)
      [null, 1],    // zadd
      [null, 1],    // expire
    ])

    const req = makeRequest('192.168.1.1')
    const result = await rateLimit(req, 'auth/login', defaultConfig)

    expect(result).not.toBeNull()
    expect(result!.status).toBe(429)
    expect(result!.headers.get('Retry-After')).toBe('60')
    expect(result!.headers.get('X-RateLimit-Limit')).toBe('10')
    expect(result!.headers.get('X-RateLimit-Remaining')).toBe('0')
    expect(result!.headers.get('Cache-Control')).toBe('no-store')

    const body = await result!.json()
    expect(body.error).toBe('TOO_MANY_REQUESTS')
  })

  it('retorna null (fail-open) quando Redis falha', async () => {
    mockExec.mockRejectedValueOnce(new Error('Redis connection refused'))

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const req = makeRequest('10.0.0.1')
    const result = await rateLimit(req, 'auth/login', defaultConfig)

    expect(result).toBeNull()
    expect(consoleSpy).toHaveBeenCalledWith(
      '[rate-limit] Erro Redis:',
      'Redis connection refused',
    )

    consoleSpy.mockRestore()
  })

  it('extrai IP do header x-forwarded-for', async () => {
    mockExec.mockResolvedValueOnce([
      [null, 0],
      [null, 0],
      [null, 1],
      [null, 1],
    ])

    const req = makeRequest('203.0.113.50')
    await rateLimit(req, 'contato', defaultConfig)

    // Verifica que zremrangebyscore foi chamado com a chave contendo o IP
    const call = mockPipeline.zremrangebyscore.mock.calls[0]
    expect(call[0]).toBe('rate-limit:contato:203.0.113.50')
  })

  it('usa o primeiro IP quando x-forwarded-for contém múltiplos IPs', async () => {
    mockExec.mockResolvedValueOnce([
      [null, 0],
      [null, 0],
      [null, 1],
      [null, 1],
    ])

    const req = makeRequest('10.0.0.1, 192.168.1.1, 172.16.0.1')
    await rateLimit(req, 'newsletter', defaultConfig)

    const call = mockPipeline.zremrangebyscore.mock.calls[0]
    expect(call[0]).toBe('rate-limit:newsletter:10.0.0.1')
  })

  it('usa "unknown" quando x-forwarded-for está ausente', async () => {
    mockExec.mockResolvedValueOnce([
      [null, 0],
      [null, 0],
      [null, 1],
      [null, 1],
    ])

    const req = makeRequest() // sem IP
    await rateLimit(req, 'auth/register', defaultConfig)

    const call = mockPipeline.zremrangebyscore.mock.calls[0]
    expect(call[0]).toBe('rate-limit:auth/register:unknown')
  })

  it('retorna null quando pipeline.exec retorna null', async () => {
    mockExec.mockResolvedValueOnce(null)

    const req = makeRequest('1.2.3.4')
    const result = await rateLimit(req, 'auth/login', defaultConfig)

    expect(result).toBeNull()
  })
})
