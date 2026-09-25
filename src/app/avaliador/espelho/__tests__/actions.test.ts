import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cookies } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { COOKIE_ESPELHO } from '../../sessao-avaliador'
import { entrarModoEspelho, sairModoEspelho } from '../actions'

vi.mock('next/headers', () => ({ cookies: vi.fn() }))
vi.mock('next/navigation', () => ({
  redirect: vi.fn((destino: string) => {
    throw new Error(`REDIRECT:${destino}`)
  }),
}))
vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
  AUDIT_ACTIONS: { ESPELHO_AVALIADOR_INICIADO: 'ESPELHO_AVALIADOR_INICIADO' },
}))

const mockAuth = vi.mocked(auth) as unknown as ReturnType<typeof vi.fn>
const mockCookies = vi.mocked(cookies) as unknown as ReturnType<typeof vi.fn>
const mockFindFirst = vi.mocked(prisma.user.findFirst)

const jar = { set: vi.fn(), delete: vi.fn() }

function formulario(avaliadorId: string) {
  const dados = new FormData()
  dados.set('avaliadorId', avaliadorId)
  return dados
}

describe('modo espelho — ações', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCookies.mockResolvedValue(jar)
  })

  it('SUPER_ADMIN grava o cookie do avaliador escolhido, registra na auditoria e segue para os recursos', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'SUPER_ADMIN' } })
    mockFindFirst.mockResolvedValue({ id: 'aval-2', nome: 'Karolina' } as never)

    await expect(entrarModoEspelho(formulario('aval-2'))).rejects.toThrow('REDIRECT:/avaliador/recursos')

    expect(jar.set).toHaveBeenCalledWith(
      COOKIE_ESPELHO,
      'aval-2',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/avaliador' }),
    )
    expect(logAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-1',
        action: 'ESPELHO_AVALIADOR_INICIADO',
        entityId: 'aval-2',
      }),
    )
  })

  it('alvo que não é avaliador ativo volta para a escolha sem gravar nada', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'SUPER_ADMIN' } })
    mockFindFirst.mockResolvedValue(null)

    await expect(entrarModoEspelho(formulario('proponente-9'))).rejects.toThrow('REDIRECT:/avaliador/espelho')

    expect(jar.set).not.toHaveBeenCalled()
    expect(logAudit).not.toHaveBeenCalled()
  })

  it.each(['AVALIADOR', 'ADMIN', 'PROPONENTE'])('%s não consegue entrar nem sair do espelho', async (role) => {
    mockAuth.mockResolvedValue({ user: { id: 'u-1', role } })

    await expect(entrarModoEspelho(formulario('aval-2'))).rejects.toThrow('REDIRECT:/')
    await expect(sairModoEspelho()).rejects.toThrow('REDIRECT:/')

    expect(jar.set).not.toHaveBeenCalled()
    expect(jar.delete).not.toHaveBeenCalled()
  })

  it('sair apaga o cookie e devolve o SUPER_ADMIN ao backoffice', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'SUPER_ADMIN' } })

    await expect(sairModoEspelho()).rejects.toThrow('REDIRECT:/admin')

    expect(jar.delete).toHaveBeenCalledWith({ name: COOKIE_ESPELHO, path: '/avaliador' })
  })
})
