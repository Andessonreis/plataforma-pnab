import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cookies } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { ESPELHO } from '../papeis'
import { entrarModoEspelho, sairModoEspelho } from '../actions'

vi.mock('next/headers', () => ({ cookies: vi.fn() }))
vi.mock('next/navigation', () => ({
  redirect: vi.fn((destino: string) => {
    throw new Error(`REDIRECT:${destino}`)
  }),
}))
vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
  AUDIT_ACTIONS: { ESPELHO_INICIADO: 'ESPELHO_INICIADO' },
}))

const mockAuth = vi.mocked(auth) as unknown as ReturnType<typeof vi.fn>
const mockCookies = vi.mocked(cookies) as unknown as ReturnType<typeof vi.fn>
const mockFindFirst = vi.mocked(prisma.user.findFirst)

const jar = { set: vi.fn(), delete: vi.fn() }

function formulario(papel: string, usuarioId = 'alvo-1') {
  const dados = new FormData()
  dados.set('papel', papel)
  dados.set('usuarioId', usuarioId)
  return dados
}

describe('modo espelho — ações', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCookies.mockResolvedValue(jar)
  })

  it.each(['AVALIADOR', 'HABILITADOR'] as const)(
    'SUPER_ADMIN grava o cookie do %s escolhido, registra na auditoria e segue para a área dele',
    async (papel) => {
      const config = ESPELHO[papel]
      mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'SUPER_ADMIN' } })
      mockFindFirst.mockResolvedValue({ id: 'alvo-1', nome: 'Karolina' } as never)

      await expect(entrarModoEspelho(formulario(papel))).rejects.toThrow(`REDIRECT:${config.destino}`)

      expect(mockFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'alvo-1', role: papel, ativo: true } }),
      )
      expect(jar.set).toHaveBeenCalledWith(
        config.cookie,
        'alvo-1',
        expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: config.caminho }),
      )
      expect(logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'admin-1',
          action: 'ESPELHO_INICIADO',
          entityId: 'alvo-1',
          details: { papel, usuario: 'Karolina' },
        }),
      )
    },
  )

  it('alvo que não é do papel pedido, ou inativo, volta para a escolha sem gravar nada', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'SUPER_ADMIN' } })
    mockFindFirst.mockResolvedValue(null)

    await expect(entrarModoEspelho(formulario('HABILITADOR', 'proponente-9'))).rejects.toThrow(
      `REDIRECT:${ESPELHO.HABILITADOR.escolha}`,
    )

    expect(jar.set).not.toHaveBeenCalled()
    expect(logAudit).not.toHaveBeenCalled()
  })

  it('papel adulterado no formulário é recusado antes de consultar qualquer usuário', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'SUPER_ADMIN' } })

    await expect(entrarModoEspelho(formulario('SUPER_ADMIN'))).rejects.toThrow('REDIRECT:/')
    await expect(sairModoEspelho(formulario('ADMIN'))).rejects.toThrow('REDIRECT:/')

    expect(mockFindFirst).not.toHaveBeenCalled()
    expect(jar.set).not.toHaveBeenCalled()
    expect(jar.delete).not.toHaveBeenCalled()
  })

  it.each(['AVALIADOR', 'HABILITADOR', 'ADMIN', 'PROPONENTE'])(
    '%s não consegue entrar nem sair do espelho',
    async (role) => {
      mockAuth.mockResolvedValue({ user: { id: 'u-1', role } })

      await expect(entrarModoEspelho(formulario('AVALIADOR'))).rejects.toThrow('REDIRECT:/')
      await expect(sairModoEspelho(formulario('AVALIADOR'))).rejects.toThrow('REDIRECT:/')

      expect(jar.set).not.toHaveBeenCalled()
      expect(jar.delete).not.toHaveBeenCalled()
    },
  )

  it.each(['AVALIADOR', 'HABILITADOR'] as const)('sair apaga o cookie do %s e volta para onde o papel manda', async (papel) => {
    const config = ESPELHO[papel]
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'SUPER_ADMIN' } })

    await expect(sairModoEspelho(formulario(papel))).rejects.toThrow(`REDIRECT:${config.saida}`)

    expect(jar.delete).toHaveBeenCalledWith({ name: config.cookie, path: config.caminho })
  })
})
