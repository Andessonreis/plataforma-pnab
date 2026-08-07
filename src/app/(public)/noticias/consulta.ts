import { prisma } from '@/lib/db'
import { stripMarkdown } from '@/lib/utils/markdown'

export const PAGE_SIZE = 9

export interface NoticiaListada {
  id: string
  slug: string
  titulo: string
  chamada: string
  tags: string[]
  imagemUrl: string | null
  /** ISO, para o atributo `dateTime` do `<time>`. */
  publicadoEmIso: string | null
  /** "31 de julho de 2026" — a linha de data da gazeta. */
  dataPorExtenso: string | null
}

export interface Noticiario {
  manchete: NoticiaListada | null
  demais: NoticiaListada[]
  total: number
  totalPaginas: number
  ultimaPublicacao: string | null
}

function porExtenso(data: Date): string {
  return data.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export type NoticiaPrisma = {
  id: string
  slug: string
  titulo: string
  corpo: string
  tags: string[]
  imagemUrl: string | null
  publicadoEm: Date | null
}

/** Mapeia uma notícia crua do Prisma para o formato de listagem/cartão —
 *  usado tanto na grade principal quanto nas "relacionadas" do detalhe. */
export function noticiaParaListagem(n: NoticiaPrisma, tamanhoChamada: number): NoticiaListada {
  return {
    id: n.id,
    slug: n.slug,
    titulo: n.titulo,
    chamada: stripMarkdown(n.corpo, tamanhoChamada),
    tags: n.tags,
    imagemUrl: n.imagemUrl,
    publicadoEmIso: n.publicadoEm?.toISOString() ?? null,
    dataPorExtenso: n.publicadoEm ? porExtenso(n.publicadoEm) : null,
  }
}

/**
 * Notícias publicadas, com a mais recente separada como manchete.
 *
 * A manchete só existe na primeira página: da segunda em diante a pessoa está
 * percorrendo o arquivo, e destacar a primeira de uma página arbitrária daria
 * a ela uma importância que ela não tem.
 */
export async function consultarNoticiario(pagina: number): Promise<Noticiario> {
  const where = { publicado: true, publicadoEm: { not: null } }

  const [noticias, total] = await Promise.all([
    prisma.noticia.findMany({
      where,
      orderBy: { publicadoEm: 'desc' },
      skip: (pagina - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        titulo: true,
        slug: true,
        corpo: true,
        tags: true,
        imagemUrl: true,
        publicadoEm: true,
      },
    }),
    prisma.noticia.count({ where }),
  ])

  const naPrimeira = pagina === 1
  const manchete = naPrimeira && noticias[0] ? noticiaParaListagem(noticias[0], 260) : null
  const demais = (naPrimeira ? noticias.slice(1) : noticias).map((n) => noticiaParaListagem(n, 150))

  // A “última publicação” é global (do noticiário todo), não da página atual.
  const ultimaData = naPrimeira
    ? noticias[0]?.publicadoEm ?? null
    : (await prisma.noticia.findFirst({
        where,
        orderBy: { publicadoEm: 'desc' },
        select: { publicadoEm: true },
      }))?.publicadoEm ?? null

  return {
    manchete,
    demais,
    total,
    totalPaginas: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    ultimaPublicacao: ultimaData ? porExtenso(ultimaData) : null,
  }
}
