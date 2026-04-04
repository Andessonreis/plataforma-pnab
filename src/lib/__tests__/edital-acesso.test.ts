import { describe, it, expect, vi, beforeEach } from 'vitest'
import { temAcessoEdital, getEditaisVisiveis } from '../edital-acesso'
import { prisma } from '@/lib/db'

const mockPrisma = vi.mocked(prisma)

describe('temAcessoEdital', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('edital sem equipe → acesso liberado', async () => {
    mockPrisma.editalMembro.count.mockResolvedValue(0)

    const result = await temAcessoEdital('user-1', 'edital-1', 'HABILITADOR')

    expect(result).toBe(true)
    expect(mockPrisma.editalMembro.count).toHaveBeenCalledWith({
      where: { editalId: 'edital-1', funcao: 'HABILITADOR' },
    })
    // Não deve consultar membro individual se não tem equipe
    expect(mockPrisma.editalMembro.findUnique).not.toHaveBeenCalled()
  })

  it('edital com equipe e user atribuído → acesso liberado', async () => {
    mockPrisma.editalMembro.count.mockResolvedValue(3)
    mockPrisma.editalMembro.findUnique.mockResolvedValue({
      id: 'membro-1',
    } as never)

    const result = await temAcessoEdital('user-1', 'edital-1', 'AVALIADOR')

    expect(result).toBe(true)
    expect(mockPrisma.editalMembro.findUnique).toHaveBeenCalledWith({
      where: {
        editalId_userId_funcao: {
          editalId: 'edital-1',
          userId: 'user-1',
          funcao: 'AVALIADOR',
        },
      },
      select: { id: true },
    })
  })

  it('edital com equipe e user não atribuído → acesso negado', async () => {
    mockPrisma.editalMembro.count.mockResolvedValue(3)
    mockPrisma.editalMembro.findUnique.mockResolvedValue(null)

    const result = await temAcessoEdital('user-2', 'edital-1', 'HABILITADOR')

    expect(result).toBe(false)
  })
})

describe('getEditaisVisiveis', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('nenhum edital com equipe → retorna null (todos visíveis)', async () => {
    mockPrisma.editalMembro.groupBy.mockResolvedValue([] as never)

    const result = await getEditaisVisiveis('user-1', 'HABILITADOR')

    expect(result).toBeNull()
  })

  it('editais com e sem equipe → filtra corretamente', async () => {
    // Edital-2 tem equipe configurada
    mockPrisma.editalMembro.groupBy.mockResolvedValue([
      { editalId: 'edital-2' },
    ] as never)

    // User está atribuído ao edital-2
    mockPrisma.editalMembro.findMany.mockResolvedValue([
      { editalId: 'edital-2' },
    ] as never)

    // Todos os editais
    mockPrisma.edital.findMany.mockResolvedValue([
      { id: 'edital-1' },
      { id: 'edital-2' },
      { id: 'edital-3' },
    ] as never)

    const result = await getEditaisVisiveis('user-1', 'HABILITADOR')

    // edital-1 (sem equipe → visível), edital-2 (tem equipe, user atribuído → visível),
    // edital-3 (sem equipe → visível)
    expect(result).toEqual(['edital-1', 'edital-2', 'edital-3'])
  })

  it('user não atribuído a edital com equipe → exclui esse edital', async () => {
    // Edital-2 tem equipe configurada
    mockPrisma.editalMembro.groupBy.mockResolvedValue([
      { editalId: 'edital-2' },
    ] as never)

    // User NÃO está atribuído a nenhum edital
    mockPrisma.editalMembro.findMany.mockResolvedValue([] as never)

    // Todos os editais
    mockPrisma.edital.findMany.mockResolvedValue([
      { id: 'edital-1' },
      { id: 'edital-2' },
      { id: 'edital-3' },
    ] as never)

    const result = await getEditaisVisiveis('user-1', 'HABILITADOR')

    // edital-2 excluído (tem equipe, user não atribuído)
    expect(result).toEqual(['edital-1', 'edital-3'])
  })
})
