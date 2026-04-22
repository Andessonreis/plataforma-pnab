import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { withErrorLogging } from '../wrapper'
import { prisma } from '@/lib/db'

const mockPrisma = vi.mocked(prisma)

function makeReq(url = 'http://localhost:3000/api/x', init: RequestInit = {}) {
  return new NextRequest(url, init)
}

function makeCtx() {
  return { params: Promise.resolve({}) }
}

describe('withErrorLogging', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.errorLog.create.mockResolvedValue({} as never)
  })

  it('passa através quando handler retorna normalmente', async () => {
    const handler = vi.fn(async () => NextResponse.json({ ok: true }))
    const wrapped = withErrorLogging(handler)

    const res = await wrapped(makeReq(), makeCtx())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(handler).toHaveBeenCalledOnce()
    expect(mockPrisma.errorLog.create).not.toHaveBeenCalled()
  })

  it('captura exception e retorna 500 genérico', async () => {
    const handler = vi.fn(async () => {
      throw new Error('boom')
    })
    const wrapped = withErrorLogging(handler)

    const res = await wrapped(makeReq('http://localhost:3000/api/test', { method: 'POST' }), makeCtx())

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('INTERNAL_ERROR')
    expect(body.requestId).toBeTruthy()

    // Persistiu o erro com contexto da request
    expect(mockPrisma.errorLog.create).toHaveBeenCalledOnce()
    const call = (mockPrisma.errorLog.create as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(call.data.message).toBe('boom')
    expect(call.data.method).toBe('POST')
    expect(call.data.path).toBe('/api/test')
    expect(call.data.statusCode).toBe(500)
  })

  it('preserva requestId do header quando fornecido', async () => {
    const handler = vi.fn(async () => {
      throw new Error('err')
    })
    const wrapped = withErrorLogging(handler)

    const res = await wrapped(
      makeReq('http://localhost:3000/api/x', {
        headers: { 'x-request-id': 'req-externo-123' },
      }),
      makeCtx(),
    )

    const body = await res.json()
    expect(body.requestId).toBe('req-externo-123')
    expect(res.headers.get('X-Request-Id')).toBe('req-externo-123')

    const call = (mockPrisma.errorLog.create as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(call.data.requestId).toBe('req-externo-123')
  })

  it('resposta 500 tem Cache-Control=no-store', async () => {
    const handler = vi.fn(async () => {
      throw new Error('x')
    })
    const wrapped = withErrorLogging(handler)

    const res = await wrapped(makeReq(), makeCtx())
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })
})
