import { describe, it, expect, vi, beforeEach } from 'vitest'

// Desfaz o mock global para testar as funções reais do audit
vi.unmock('@/lib/audit')

import { logAudit, actionBadgeVariant, getRetentionDays } from '../index'
import { prisma } from '@/lib/db'

const mockPrisma = vi.mocked(prisma)

describe('logAudit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.auditLog.create.mockResolvedValue({} as never)
  })

  it('chama prisma.auditLog.create com dados corretos', async () => {
    await logAudit({
      userId: 'user-1',
      action: 'LOGIN',
      entity: 'User',
      entityId: 'user-1',
      details: { browser: 'Chrome' },
      ip: '127.0.0.1',
    })

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        action: 'LOGIN',
        entity: 'User',
        entityId: 'user-1',
        details: { browser: 'Chrome' },
        ip: '127.0.0.1',
      },
    })
  })

  it('userId opcional (null)', async () => {
    await logAudit({
      action: 'STATUS_ALTERADO',
      entity: 'Edital',
      entityId: 'e1',
    })

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: null,
        action: 'STATUS_ALTERADO',
      }),
    })
  })

  it('falha no Prisma não lança exceção', async () => {
    mockPrisma.auditLog.create.mockRejectedValue(new Error('DB down'))

    // Não deve lançar
    await expect(logAudit({ action: 'LOGIN' })).resolves.toBeUndefined()
  })
})

describe('actionBadgeVariant', () => {
  it('LOGIN retorna success', () => {
    expect(actionBadgeVariant('LOGIN')).toBe('success')
  })

  it('LOGIN_FALHA retorna error', () => {
    expect(actionBadgeVariant('LOGIN_FALHA')).toBe('error')
  })

  it('EDITAL_CRIADO retorna success', () => {
    expect(actionBadgeVariant('EDITAL_CRIADO')).toBe('success')
  })

  it('EDITAL_PUBLICADO retorna info', () => {
    expect(actionBadgeVariant('EDITAL_PUBLICADO')).toBe('info')
  })
})

describe('getRetentionDays', () => {
  it('sem env retorna 365', () => {
    delete process.env.AUDIT_RETENTION_DAYS
    expect(getRetentionDays()).toBe(365)
  })
})
