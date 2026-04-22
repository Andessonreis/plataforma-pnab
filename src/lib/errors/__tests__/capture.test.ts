import { describe, it, expect, vi, beforeEach } from 'vitest'
import { computeFingerprint, sanitize, captureError } from '../capture'
import { prisma } from '@/lib/db'

const mockPrisma = vi.mocked(prisma)

describe('computeFingerprint', () => {
  it('gera o mesmo hash pra dois erros com mesma origem (determinístico)', () => {
    // Mesmo nome, mensagem e frames da app → mesmo fingerprint
    const a = new Error('Connection refused')
    a.stack = `Error: Connection refused\n    at foo (/app/src/x.ts:10)\n    at bar (/app/src/y.ts:5)`
    const b = new Error('Connection refused')
    b.stack = `Error: Connection refused\n    at foo (/app/src/x.ts:10)\n    at bar (/app/src/y.ts:5)`

    expect(computeFingerprint(a)).toBe(computeFingerprint(b))
  })

  it('gera hashes diferentes pra erros com mensagens distintas', () => {
    const a = new Error('Connection refused')
    const b = new Error('Timeout')
    expect(computeFingerprint(a)).not.toBe(computeFingerprint(b))
  })

  it('ignora frames de node_modules no fingerprint', () => {
    // Dois erros com mesma mensagem mas stacks vindos de caminhos diferentes
    // em node_modules devem agrupar juntos (só conta frames da app)
    const a = new Error('boom')
    a.stack = `Error: boom\n    at foo (/app/src/x.ts:10)\n    at bar (/app/node_modules/pkg1/a.js:1)`
    const b = new Error('boom')
    b.stack = `Error: boom\n    at foo (/app/src/x.ts:10)\n    at bar (/app/node_modules/pkg2/b.js:1)`
    expect(computeFingerprint(a)).toBe(computeFingerprint(b))
  })

  it('retorna string hex de 16 chars', () => {
    const fp = computeFingerprint(new Error('x'))
    expect(fp).toMatch(/^[a-f0-9]{16}$/)
  })
})

describe('sanitize', () => {
  it('ofusca campos de senha/token/secret', () => {
    const input = { password: 'hunter2', api_key: 'abc', token: 'xyz', nome: 'Ana' }
    const out = sanitize(input) as Record<string, unknown>
    expect(out.password).toBe('[REDACTED]')
    expect(out.api_key).toBe('[REDACTED]')
    expect(out.token).toBe('[REDACTED]')
    expect(out.nome).toBe('Ana')
  })

  it('case-insensitive em chaves sensíveis', () => {
    const input = { Password: 'x', AUTHORIZATION: 'y', Cookie: 'z' }
    const out = sanitize(input) as Record<string, unknown>
    expect(out.Password).toBe('[REDACTED]')
    expect(out.AUTHORIZATION).toBe('[REDACTED]')
    expect(out.Cookie).toBe('[REDACTED]')
  })

  it('recursivo — objetos aninhados também sanitizados', () => {
    const input = { user: { nome: 'Ana', password: 'x' } }
    const out = sanitize(input) as { user: Record<string, unknown> }
    expect(out.user.nome).toBe('Ana')
    expect(out.user.password).toBe('[REDACTED]')
  })

  it('trunca arrays grandes (máx 50)', () => {
    const input = Array.from({ length: 200 }, (_, i) => i)
    const out = sanitize(input) as number[]
    expect(out.length).toBe(50)
  })

  it('limita profundidade recursiva', () => {
    const deep: Record<string, unknown> = { l0: { l1: { l2: { l3: { l4: { password: 'x' } } } } } }
    // não deve lançar nem recursionar infinito
    const out = sanitize(deep)
    expect(out).toBeDefined()
  })

  it('preserva valores primitivos e null', () => {
    expect(sanitize(null)).toBeNull()
    expect(sanitize(42)).toBe(42)
    expect(sanitize('text')).toBe('text')
    expect(sanitize(true)).toBe(true)
  })
})

describe('captureError', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.errorLog.create.mockResolvedValue({} as never)
  })

  it('persiste erro básico no banco', async () => {
    const err = new Error('Something broke')
    await captureError(err, { requestId: 'req-1', method: 'POST', path: '/api/x' })

    expect(mockPrisma.errorLog.create).toHaveBeenCalledOnce()
    const call = (mockPrisma.errorLog.create as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(call.data.message).toBe('Something broke')
    expect(call.data.level).toBe('error')
    expect(call.data.fingerprint).toMatch(/^[a-f0-9]{16}$/)
    expect(call.data.requestId).toBe('req-1')
    expect(call.data.method).toBe('POST')
    expect(call.data.path).toBe('/api/x')
  })

  it('nunca lança mesmo se prisma falhar', async () => {
    mockPrisma.errorLog.create.mockRejectedValue(new Error('DB down'))
    await expect(captureError(new Error('original'))).resolves.toBeUndefined()
  })

  it('aceita unknown — converte pra Error', async () => {
    await captureError('erro em string')
    const call = (mockPrisma.errorLog.create as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(call.data.message).toBe('erro em string')
  })

  it('sanitiza extra antes de persistir (redige senha)', async () => {
    await captureError(new Error('x'), {
      extra: { body: { email: 'a@a.com', password: 'hunter2' } },
    })
    const call = (mockPrisma.errorLog.create as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
    const ctx = call.data.context as { body: { password: string; email: string } }
    expect(ctx.body.password).toBe('[REDACTED]')
    expect(ctx.body.email).toBe('a@a.com')
  })

  it('trunca stack > 10000 chars', async () => {
    const err = new Error('x')
    err.stack = 'at frame\n'.repeat(2000) // ~18KB
    await captureError(err)
    const call = (mockPrisma.errorLog.create as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(call.data.stack.length).toBeLessThanOrEqual(10_000)
  })

  it('respeita level="warn" quando passado', async () => {
    await captureError(new Error('aviso'), { level: 'warn' })
    const call = (mockPrisma.errorLog.create as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(call.data.level).toBe('warn')
  })

  it('trunca user-agent a 500 chars', async () => {
    await captureError(new Error('x'), { userAgent: 'A'.repeat(1000) })
    const call = (mockPrisma.errorLog.create as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(call.data.userAgent.length).toBe(500)
  })
})
