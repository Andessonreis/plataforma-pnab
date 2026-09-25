import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cookies } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { COOKIE_ESPELHO, exigirSessaoAvaliador, obterSessaoAvaliador } from '../sessao-avaliador'

vi.mock('next/headers', () => ({ cookies: vi.fn() }))
vi.mock('next/navigation', () => ({
  redirect: vi.fn((destino: string) => {
    throw new Error(`REDIRECT:${destino}`)
  }),
}))

const mockAuth = vi.mocked(auth) as unknown as ReturnType<typeof vi.fn>
const mockCookies = vi.mocked(cookies) as unknown as ReturnType<typeof vi.fn>
const mockFindFirst = vi.mocked(prisma.user.findFirst)

function sessao(role: string, id = 'user-1', name = 'Fulano') {
  mockAuth.mockResolvedValue({ user: { id, role, name } })
}

function cookieEspelho(valor?: string) {
  mockCookies.mockResolvedValue({
    get: (nome: string) => (nome === COOKIE_ESPELHO && valor ? { value: valor } : undefined),
  })
}

describe('sessão da área do avaliador', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cookieEspelho(undefined)
  })

  it('avaliador enxerga a si mesmo', async () => {
    sessao('AVALIADOR', 'aval-1', 'Karla')

    expect(await obterSessaoAvaliador()).toEqual({ avaliadorId: 'aval-1', nome: 'Karla', espelho: false })
  })

  it('ignora o cookie do espelho quando quem pede é avaliador, senão ele assumiria a visão de outro', async () => {
    sessao('AVALIADOR', 'aval-1', 'Karla')
    cookieEspelho('aval-2')

    const resultado = await obterSessaoAvaliador()

    expect(resultado).toEqual({ avaliadorId: 'aval-1', nome: 'Karla', espelho: false })
    expect(mockFindFirst).not.toHaveBeenCalled()
  })

  it('SUPER_ADMIN com cookie válido vê como o avaliador escolhido, em modo espelho', async () => {
    sessao('SUPER_ADMIN', 'admin-1', 'Andesson')
    cookieEspelho('aval-2')
    mockFindFirst.mockResolvedValue({ id: 'aval-2', nome: 'Karolina' } as never)

    expect(await obterSessaoAvaliador()).toEqual({ avaliadorId: 'aval-2', nome: 'Karolina', espelho: true })
    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { id: 'aval-2', role: 'AVALIADOR', ativo: true },
      select: { id: true, nome: true },
    })
  })

  it('SUPER_ADMIN sem cookie, ou com alvo que não é avaliador ativo, não tem visão', async () => {
    sessao('SUPER_ADMIN')
    expect(await obterSessaoAvaliador()).toBeNull()

    cookieEspelho('qualquer-id')
    mockFindFirst.mockResolvedValue(null)
    expect(await obterSessaoAvaliador()).toBeNull()
  })

  it.each(['PROPONENTE', 'ADMIN', 'HABILITADOR', 'COMUNICACAO', 'ATENDIMENTO'])(
    '%s não ganha visão de avaliador, mesmo com cookie',
    async (role) => {
      sessao(role)
      cookieEspelho('aval-2')

      expect(await obterSessaoAvaliador()).toBeNull()
      expect(mockFindFirst).not.toHaveBeenCalled()
    },
  )

  it('páginas mandam o SUPER_ADMIN sem alvo para a escolha e os demais para o login', async () => {
    sessao('SUPER_ADMIN')
    await expect(exigirSessaoAvaliador()).rejects.toThrow('REDIRECT:/avaliador/espelho')

    sessao('PROPONENTE')
    await expect(exigirSessaoAvaliador()).rejects.toThrow('REDIRECT:/login')

    mockAuth.mockResolvedValue(null)
    await expect(exigirSessaoAvaliador()).rejects.toThrow('REDIRECT:/login')
  })
})
