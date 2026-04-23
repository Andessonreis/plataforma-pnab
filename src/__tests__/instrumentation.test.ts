import { describe, it, expect, vi, beforeEach } from 'vitest'
import { onRequestError } from '../instrumentation'
import { prisma } from '@/lib/db'

const mockPrisma = vi.mocked(prisma)

function ctx(overrides: Record<string, unknown> = {}) {
  return {
    routerKind: 'App Router' as const,
    routePath: '/api/x',
    routeType: 'route' as const,
    ...overrides,
  }
}

describe('onRequestError', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.errorLog.create.mockResolvedValue({} as never)
  })

  it('persiste erro com path/method/requestId do request', async () => {
    const err = new Error('boom')
    await onRequestError(
      err,
      {
        path: '/api/test',
        method: 'POST',
        headers: { 'x-request-id': 'req-abc' },
      },
      ctx(),
    )

    expect(mockPrisma.errorLog.create).toHaveBeenCalledOnce()
    const call = (mockPrisma.errorLog.create as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(call.data.message).toBe('boom')
    expect(call.data.path).toBe('/api/test')
    expect(call.data.method).toBe('POST')
    expect(call.data.requestId).toBe('req-abc')
    expect(call.data.level).toBe('error')
  })

  it('extrai IP do x-forwarded-for (primeiro IP)', async () => {
    await onRequestError(
      new Error('x'),
      {
        path: '/x',
        method: 'GET',
        headers: { 'x-forwarded-for': '10.0.0.1, 200.1.2.3' },
      },
      ctx(),
    )
    const call = (mockPrisma.errorLog.create as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(call.data.ip).toBe('10.0.0.1')
  })

  it('extrai user-agent quando presente', async () => {
    await onRequestError(
      new Error('x'),
      {
        path: '/x',
        method: 'GET',
        headers: { 'user-agent': 'Mozilla/5.0 Test' },
      },
      ctx(),
    )
    const call = (mockPrisma.errorLog.create as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(call.data.userAgent).toBe('Mozilla/5.0 Test')
  })

  it('inclui routeType + routerKind + routePath no context', async () => {
    await onRequestError(
      new Error('x'),
      { path: '/admin', method: 'GET', headers: {} },
      ctx({ routeType: 'render', routePath: '/admin/logs' }),
    )
    const call = (mockPrisma.errorLog.create as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
    const extra = call.data.context as Record<string, unknown>
    expect(extra.routerKind).toBe('App Router')
    expect(extra.routeType).toBe('render')
    expect(extra.routePath).toBe('/admin/logs')
  })

  it('preserva digest quando Error tem (Next sempre adiciona)', async () => {
    const err = Object.assign(new Error('boom'), { digest: '3231245' })
    await onRequestError(
      err,
      { path: '/x', method: 'GET', headers: {} },
      ctx(),
    )
    const call = (mockPrisma.errorLog.create as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect((call.data.context as { digest?: string }).digest).toBe('3231245')
  })

  it('não lança quando prisma falha', async () => {
    mockPrisma.errorLog.create.mockRejectedValue(new Error('DB down'))
    await expect(
      onRequestError(
        new Error('orig'),
        { path: '/x', method: 'GET', headers: {} },
        ctx(),
      ),
    ).resolves.toBeUndefined()
  })
})
