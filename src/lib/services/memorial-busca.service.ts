import { prisma } from '@/lib/db'

const POR_GRUPO = 8

/**
 * Busca do painel: um termo ("Zé Bigode") devolve pessoas, fotos e itens do acervo,
 * eventos e exposições de uma vez, em qualquer status, para a equipe achar o que
 * cadastrou. Etiquetas (tags) são guardadas em minúsculas e casam pelo termo inteiro.
 */
export async function buscarNoMemorial(termo: string) {
  const q = { contains: termo, mode: 'insensitive' as const }
  const tag = termo.toLowerCase()

  const [exposicoes, acervo, pessoas, eventos] = await Promise.all([
    prisma.memorialExposicao.findMany({
      where: { OR: [{ titulo: q }, { subtitulo: q }, { descricao: q }] },
      select: { id: true, titulo: true, status: true },
      orderBy: { updatedAt: 'desc' },
      take: POR_GRUPO,
    }),
    prisma.memorialAcervoItem.findMany({
      where: {
        OR: [{ titulo: q }, { legenda: q }, { descricao: q }, { local: q }, { tags: { has: tag } }],
      },
      select: { id: true, titulo: true, status: true, tipo: true, versaoWebUrl: true, arquivoUrl: true },
      orderBy: { updatedAt: 'desc' },
      take: POR_GRUPO,
    }),
    prisma.memorialPessoa.findMany({
      where: { OR: [{ nome: q }, { biografia: q }] },
      select: { id: true, nome: true, status: true },
      orderBy: { nome: 'asc' },
      take: POR_GRUPO,
    }),
    prisma.memorialEvento.findMany({
      where: { OR: [{ titulo: q }, { descricao: q }, { periodo: q }] },
      select: { id: true, titulo: true, status: true, ano: true },
      orderBy: { ano: 'asc' },
      take: POR_GRUPO,
    }),
  ])

  return { exposicoes, acervo, pessoas, eventos }
}

export type ResultadoBusca = Awaited<ReturnType<typeof buscarNoMemorial>>
