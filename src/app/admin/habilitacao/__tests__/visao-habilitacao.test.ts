import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cookies } from 'next/headers'
import type { Session } from 'next-auth'
import { prisma } from '@/lib/db'
import { ESPELHO } from '@/lib/espelho/papeis'
import { resolverVisaoHabilitacao } from '../visao-habilitacao'

vi.mock('next/headers', () => ({ cookies: vi.fn() }))

const mockCookies = vi.mocked(cookies) as unknown as ReturnType<typeof vi.fn>
const mockFindFirst = vi.mocked(prisma.user.findFirst)

function sessao(role: string, id = 'user-1'): Session {
  return { user: { id, role, name: 'Fulano' } } as unknown as Session
}

function cookieEspelho(valor?: string) {
  mockCookies.mockResolvedValue({
    get: (nome: string) => (nome === ESPELHO.HABILITADOR.cookie && valor ? { value: valor } : undefined),
  })
}

describe('visão das telas de habilitação', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cookieEspelho(undefined)
  })

  it('habilitador é delimitado pela própria equipe', async () => {
    expect(await resolverVisaoHabilitacao(sessao('HABILITADOR', 'hab-1'))).toEqual({
      escopoId: 'hab-1',
      espelho: null,
    })
  })

  it('habilitador ignora o cookie do espelho, senão assumiria a equipe de um colega', async () => {
    cookieEspelho('hab-2')

    expect(await resolverVisaoHabilitacao(sessao('HABILITADOR', 'hab-1'))).toEqual({
      escopoId: 'hab-1',
      espelho: null,
    })
    expect(mockFindFirst).not.toHaveBeenCalled()
  })

  it.each(['ADMIN', 'SUPER_ADMIN'])('%s sem espelho vê tudo, sem escopo de equipe', async (role) => {
    expect(await resolverVisaoHabilitacao(sessao(role))).toEqual({ escopoId: null, espelho: null })
  })

  it('SUPER_ADMIN com cookie válido passa a ter o escopo do habilitador escolhido, em modo espelho', async () => {
    cookieEspelho('hab-2')
    mockFindFirst.mockResolvedValue({ id: 'hab-2', nome: 'Bruno' } as never)

    expect(await resolverVisaoHabilitacao(sessao('SUPER_ADMIN'))).toEqual({ escopoId: 'hab-2', espelho: 'Bruno' })
    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'hab-2', role: 'HABILITADOR', ativo: true } }),
    )
  })

  it('SUPER_ADMIN com cookie de alvo inválido volta à visão completa', async () => {
    cookieEspelho('qualquer-id')
    mockFindFirst.mockResolvedValue(null)

    expect(await resolverVisaoHabilitacao(sessao('SUPER_ADMIN'))).toEqual({ escopoId: null, espelho: null })
  })

  it('o cookie do espelho de avaliador não vale para a habilitação', async () => {
    mockCookies.mockResolvedValue({
      get: (nome: string) => (nome === ESPELHO.AVALIADOR.cookie ? { value: 'aval-1' } : undefined),
    })

    expect(await resolverVisaoHabilitacao(sessao('SUPER_ADMIN'))).toEqual({ escopoId: null, espelho: null })
    expect(mockFindFirst).not.toHaveBeenCalled()
  })
})
