import { prisma } from '@/lib/db'

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

/**
 * Tira a marcação do corpo para virar chamada de capa.
 *
 * O corte anterior removia só `# * _ \``, então links, imagens e citações
 * chegavam à listagem como `[texto](url)` e `> `. Aqui a limpeza é por
 * construção do Markdown, na ordem que evita deixar resto: primeiro os
 * blocos, depois o inline.
 */
function chamadaDoCorpo(corpo: string, limite: number): string {
  const limpo = corpo
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/[*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (limpo.length <= limite) return limpo
  const corte = limpo.slice(0, limite)
  const ultimoEspaco = corte.lastIndexOf(' ')
  return (ultimoEspaco > 0 ? corte.slice(0, ultimoEspaco) : corte) + '...'
}

function porExtenso(data: Date): string {
  return data.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
}

type NoticiaPrisma = {
  id: string
  slug: string
  titulo: string
  corpo: string
  tags: string[]
  imagemUrl: string | null
  publicadoEm: Date | null
}

function paraListagem(n: NoticiaPrisma, tamanhoChamada: number): NoticiaListada {
  return {
    id: n.id,
    slug: n.slug,
    titulo: n.titulo,
    chamada: chamadaDoCorpo(n.corpo, tamanhoChamada),
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
  const manchete = naPrimeira && noticias[0] ? paraListagem(noticias[0], 260) : null
  const demais = (naPrimeira ? noticias.slice(1) : noticias).map((n) => paraListagem(n, 150))

  return {
    manchete,
    demais,
    total,
    totalPaginas: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    ultimaPublicacao: noticias[0]?.publicadoEm ? porExtenso(noticias[0].publicadoEm) : null,
  }
}
