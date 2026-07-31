import { prisma } from '@/lib/db'

export interface Duvida {
  id: string
  pergunta: string
  resposta: string
}

export interface CadernoDeDuvidas {
  id: string
  titulo: string
  /** Presente quando o caderno é de um edital específico. */
  editalSlug?: string
  duvidas: Duvida[]
}

export const CADERNO_GERAL = 'gerais'

/**
 * Dúvidas publicadas, em cadernos: as gerais e um por edital que tenha as
 * suas. O agrupamento vem do banco (`editalId`), não de convenção de texto.
 */
export async function consultarDuvidas(): Promise<CadernoDeDuvidas[]> {
  const itens = await prisma.faqItem.findMany({
    where: { publicado: true },
    orderBy: { ordem: 'asc' },
    select: {
      id: true,
      pergunta: true,
      resposta: true,
      editalId: true,
      edital: { select: { titulo: true, slug: true } },
    },
  })

  const gerais: Duvida[] = []
  const porEdital = new Map<string, CadernoDeDuvidas>()

  for (const item of itens) {
    const duvida = { id: item.id, pergunta: item.pergunta, resposta: item.resposta }

    if (!item.editalId || !item.edital) {
      gerais.push(duvida)
      continue
    }

    if (!porEdital.has(item.edital.slug)) {
      porEdital.set(item.edital.slug, {
        id: item.edital.slug,
        titulo: item.edital.titulo,
        editalSlug: item.edital.slug,
        duvidas: [],
      })
    }
    porEdital.get(item.edital.slug)!.duvidas.push(duvida)
  }

  const cadernos: CadernoDeDuvidas[] = []
  if (gerais.length > 0) {
    cadernos.push({ id: CADERNO_GERAL, titulo: 'Dúvidas gerais', duvidas: gerais })
  }
  return [...cadernos, ...porEdital.values()]
}
