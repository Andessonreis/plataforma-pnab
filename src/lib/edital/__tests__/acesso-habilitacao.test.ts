import { describe, it, expect, vi, beforeEach } from 'vitest'
import { logAudit } from '@/lib/audit'
import { temAcessoEdital } from '@/lib/edital-acesso'
import { ROLES_HABILITACAO, acessoHabilitacaoPermitido } from '../acesso-habilitacao'

vi.mock('@/lib/edital-acesso', () => ({ temAcessoEdital: vi.fn() }))

const mockLogAudit = vi.mocked(logAudit)
const mockTemAcesso = vi.mocked(temAcessoEdital)

const escopo = {
  userId: 'u1',
  editalId: 'ed-1',
  alvo: { entity: 'Inscricao' as const, id: 'insc-1' },
  ip: '203.0.113.7',
}

describe('acessoHabilitacaoPermitido', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockLogAudit.mockResolvedValue(undefined)
  })

  it('reconhece os papéis que operam a habilitação', () => {
    expect(ROLES_HABILITACAO).toEqual(['HABILITADOR', 'SUPER_ADMIN', 'ADMIN'])
  })

  it.each(['ADMIN', 'SUPER_ADMIN'] as const)('%s não passa pelo escopo de equipe', async (role) => {
    expect(await acessoHabilitacaoPermitido({ ...escopo, role })).toBe(true)
    expect(mockTemAcesso).not.toHaveBeenCalled()
  })

  it('HABILITADOR da equipe é permitido, sem registro de negativa', async () => {
    mockTemAcesso.mockResolvedValue(true)

    expect(await acessoHabilitacaoPermitido({ ...escopo, role: 'HABILITADOR' })).toBe(true)
    expect(mockTemAcesso).toHaveBeenCalledWith('u1', 'ed-1', 'HABILITADOR')
    expect(mockLogAudit).not.toHaveBeenCalled()
  })

  it('HABILITADOR fora da equipe é negado e a tentativa fica auditada no alvo informado', async () => {
    mockTemAcesso.mockResolvedValue(false)

    expect(await acessoHabilitacaoPermitido({ ...escopo, role: 'HABILITADOR' })).toBe(false)
    expect(mockLogAudit).toHaveBeenCalledWith({
      userId: 'u1',
      action: 'HABILITACAO_ACESSO_NEGADO',
      entity: 'Inscricao',
      entityId: 'insc-1',
      details: {
        editalId: 'ed-1',
        motivo: 'Usuário não pertence à equipe de habilitação deste edital.',
      },
      ip: '203.0.113.7',
    })
  })
})
