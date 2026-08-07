import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { formatCurrency } from '@/lib/utils/format'
import { SITUACOES } from './tipos'
import type { FiltrosPrestacao, GrupoEdital, Prestacao, ProjetoRegistrado, RelatorioItem } from './tipos'

/** Editais completos por página — nunca corta um grupo ao meio. */
const EDITAIS_POR_PAGINA = 5

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

/** Só aceita o formato `{ titulo, url }[]`; qualquer outra forma no JSON livre é ignorada. */
function extrairRelatorios(json: unknown): RelatorioItem[] {
  if (!Array.isArray(json)) return []
  return json.filter((item): item is RelatorioItem => {
    if (typeof item !== 'object' || item === null) return false
    const registro = item as Record<string, unknown>
    return typeof registro.titulo === 'string' && typeof registro.url === 'string'
  })
}

/**
 * Prestação de contas dos projetos apoiados, agrupada por edital e paginada
 * por grupo inteiro.
 *
 * Paginar por linha cortaria um edital ao meio na virada de página. Em vez
 * disso a consulta busca todos os projetos que casam com os filtros (o
 * volume é de um programa municipal, cabe buscar de uma vez), agrupa por
 * edital, e só então corta os grupos em páginas de `EDITAIS_POR_PAGINA`. Os
 * totais da abertura somam sobre os filtros aplicados, não sobre a página
 * exibida — senão o "Investido na cultura" mudaria a cada página.
 *
 * Os anos disponíveis são consultados à parte dos projetos: filtrados na mesma
 * consulta, escolher um ano apagaria as abas dos outros e a pessoa ficaria sem
 * caminho de volta.
 */
export async function consultarPrestacao(filtros: FiltrosPrestacao = {}): Promise<Prestacao> {
  const { ano, situacao, q, pagina = 1 } = filtros

  const where: Prisma.ProjetoApoiadoWhereInput = {
    publicado: true,
    ...(ano ? { inscricao: { edital: { ano } } } : {}),
    ...(situacao ? { statusExecucao: situacao } : {}),
    ...(q
      ? {
          OR: [
            { inscricao: { proponente: { nome: { contains: q, mode: 'insensitive' } } } },
            { inscricao: { numero: { contains: q, mode: 'insensitive' } } },
          ],
        }
      : {}),
  }

  const [projetos, anosPublicados] = await Promise.all([
    prisma.projetoApoiado.findMany({
      where,
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

  interface GrupoInterno {
    slug: string
    titulo: string
    ano: number
    projetos: ProjetoRegistrado[]
    somaGrupo: number
  }

  const gruposMap = new Map<string, GrupoInterno>()
  let soma = 0
  let concluidos = 0

  for (const projeto of projetos) {
    const { edital, proponente } = projeto.inscricao
    const valorNumero = Number(projeto.valorAprovado)
    soma += valorNumero
    if (projeto.statusExecucao === 'CONCLUIDO') concluidos += 1

    if (!gruposMap.has(edital.slug)) {
      gruposMap.set(edital.slug, {
        slug: edital.slug,
        titulo: edital.titulo,
        ano: edital.ano,
        projetos: [],
        somaGrupo: 0,
      })
    }

    const grupo = gruposMap.get(edital.slug)!
    grupo.somaGrupo += valorNumero
    grupo.projetos.push({
      id: projeto.id,
      nome: nomeDoProjeto(projeto.inscricao.campos) ?? proponente.nome,
      proponente: proponente.nome,
      numeroInscricao: projeto.inscricao.numero,
      categoria: projeto.inscricao.categoria,
      valor: formatCurrency(valorNumero),
      contrapartida: projeto.contrapartida,
      situacao: SITUACOES[projeto.statusExecucao] ?? {
        label: projeto.statusExecucao,
        tom: 'arquivo' as const,
      },
      imagens: projeto.mediaUrls,
      relatorios: extrairRelatorios(projeto.relatorios),
    })
  }

  const grupamentoCompleto: GrupoEdital[] = [...gruposMap.values()]
    .sort((a, b) => b.ano - a.ano || a.titulo.localeCompare(b.titulo, 'pt-BR'))
    .map(({ somaGrupo, ...grupo }) => ({ ...grupo, subtotal: formatCurrency(somaGrupo) }))

  const totalPaginas = Math.max(1, Math.ceil(grupamentoCompleto.length / EDITAIS_POR_PAGINA))
  const paginaAtual = Math.min(Math.max(1, pagina), totalPaginas)
  const inicio = (paginaAtual - 1) * EDITAIS_POR_PAGINA

  return {
    grupos: grupamentoCompleto.slice(inicio, inicio + EDITAIS_POR_PAGINA),
    anos: [...new Set(anosPublicados.map((p) => p.inscricao.edital.ano))].sort((a, b) => b - a),
    totalProjetos: projetos.length,
    valorTotal: formatCurrency(soma),
    concluidos,
    emExecucao: projetos.length - concluidos,
    paginaAtual,
    totalPaginas,
  }
}
