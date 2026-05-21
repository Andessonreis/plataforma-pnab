import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../route'
import { prisma } from '@server/lib/db'
import { redis } from '@/lib/redis'

const mockPrisma = vi.mocked(prisma)
const mockRedis = vi.mocked(redis)

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Defaults ok
    ;(mockPrisma.$queryRaw as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([{ '?column?': 1 }])
    mockRedis.ping.mockResolvedValue('PONG')
  })

  it('tudo OK → 200 com status=ok', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('ok')
    expect(body.checks).toEqual({ db: 'ok', redis: 'ok' })
    expect(typeof body.uptime).toBe('number')
    expect(body.requestId).toBeTruthy()
    expect(body.timestamp).toBeTruthy()
  })

  it('DB falha → 503 com check db=fail', async () => {
    ;(mockPrisma.$queryRaw as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('connection refused'))
    const res = await GET()
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.status).toBe('degraded')
    expect(body.checks.db).toBe('fail')
    expect(body.checks.redis).toBe('ok')
  })

  it('Redis falha → 503 com check redis=fail', async () => {
    mockRedis.ping.mockRejectedValue(new Error('redis down'))
    const res = await GET()
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.status).toBe('degraded')
    expect(body.checks.redis).toBe('fail')
  })

  it('Redis responde algo != PONG → check=fail', async () => {
    mockRedis.ping.mockResolvedValue('WRONG' as never)
    const res = await GET()
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.checks.redis).toBe('fail')
  })

  it('retorna header X-Request-Id e Cache-Control=no-store', async () => {
    const res = await GET()
    expect(res.headers.get('X-Request-Id')).toBeTruthy()
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })
})
