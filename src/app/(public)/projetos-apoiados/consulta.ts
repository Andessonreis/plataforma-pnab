import { prisma } from '@/lib/db'
import { formatCurrency } from '@/lib/utils/format'
import type { TomCarimbo } from '@/components/ui/carimbo'

export interface ProjetoRegistrado {
  id: string
  nome: string
  proponente: string
  numeroInscricao: string
  categoria: string | null
  valor: string
  contrapartida: string | null
  situacao: { label: string; tom: TomCarimbo }
  /** Fotos enviadas na execução do projeto. Vazio na maioria dos registros. */
  imagens: string[]
}

export interface GrupoEdital {
  slug: string
  titulo: string
  ano: number
  projetos: ProjetoRegistrado[]
}

export interface Prestacao {
  grupos: GrupoEdital[]
  anos: number[]
  totalProjetos: number
  valorTotal: string
  concluidos: number
  emExecucao: number
}

const SITUACOES: Record<string, { label: string; tom: TomCarimbo }> = {
  EM_EXECUCAO: { label: 'Em execução', tom: 'curso' },
  CONCLUIDO: { label: 'Concluído', tom: 'safra' },
  PRESTACAO_CONTAS: { label: 'Prestação de contas', tom: 'prestacao' },
  CANCELADO: { label: 'Cancelado', tom: 'arquivo' },
}

/** O nome do projeto vive no formulário da inscrição, que é JSON livre. */
function nomeDoProjeto(campos: unknown): string | null {
  let dados = campos
  if (typeof dados === 'string') {
    try {
      dados = JSON.parse(dados)
    } catch {
      return null
    }
  }
  if (typeof dados === 'object' && dados !== null && 'nomeProjeto' in dados) {
    const nome = (dados as { nomeProjeto: unknown }).nomeProjeto
    return typeof nome === 'string' && nome.trim() ? nome : null
  }
  return null
}

/**
 * Prestação de contas dos projetos apoiados, já agrupada por edital.
 *
 * Os anos disponíveis são consultados à parte dos projetos: filtrados na mesma
 * consulta, escolher um ano apagaria as abas dos outros e a pessoa ficaria sem
 * caminho de volta.
 */
export async function consultarPrestacao(ano?: number): Promise<Prestacao> {
  const [projetos, anosPublicados] = await Promise.all([
    prisma.projetoApoiado.findMany({
      where: { publicado: true, ...(ano ? { inscricao: { edital: { ano } } } : {}) },
      orderBy: { valorAprovado: 'desc' },
      include: {
        inscricao: {
          select: {
            numero: true,
            categoria: true,
            campos: true,
            edital: { select: { titulo: true, slug: true, ano: true } },
            proponente: { select: { nome: true } },
          },
        },
      },
    }),
    prisma.projetoApoiado.findMany({
      where: { publicado: true },
      select: { inscricao: { select: { edital: { select: { ano: true } } } } },
      distinct: ['inscricaoId'],
    }),
  ])

  const grupos = new Map<string, GrupoEdital>()
  let soma = 0
  let concluidos = 0

  for (const projeto of projetos) {
    const { edital, proponente } = projeto.inscricao
    soma += Number(projeto.valorAprovado)
    if (projeto.statusExecucao === 'CONCLUIDO') concluidos += 1

    if (!grupos.has(edital.slug)) {
      grupos.set(edital.slug, { slug: edital.slug, titulo: edital.titulo, ano: edital.ano, projetos: [] })
    }

    grupos.get(edital.slug)!.projetos.push({
      id: projeto.id,
      nome: nomeDoProjeto(projeto.inscricao.campos) ?? proponente.nome,
      proponente: proponente.nome,
      numeroInscricao: projeto.inscricao.numero,
      categoria: projeto.inscricao.categoria,
      valor: formatCurrency(Number(projeto.valorAprovado)),
      contrapartida: projeto.contrapartida,
      situacao: SITUACOES[projeto.statusExecucao] ?? {
        label: projeto.statusExecucao,
        tom: 'arquivo' as const,
      },
      imagens: projeto.mediaUrls,
    })
  }

  return {
    grupos: [...grupos.values()].sort((a, b) => b.ano - a.ano),
    anos: [...new Set(anosPublicados.map((p) => p.inscricao.edital.ano))].sort((a, b) => b - a),
    totalProjetos: projetos.length,
    valorTotal: formatCurrency(soma),
    concluidos,
    emExecucao: projetos.length - concluidos,
  }
}
