import { prisma } from '@/lib/db'
import { calculateResults } from './calculate'
import { alocarVagasCategoria, type StatusAlocacao } from './alocar-cotas'
import type { CategoriaConfig } from '@/types/categoria-config'

/**
 * Classificação por categoria, na mesma forma que a publicação gravaria.
 *
 * Existe para que a tela de resultados e o PDF baixado saiam do mesmo cálculo —
 * uma lista que vai ao Diário Oficial não pode divergir da que a Secretaria viu
 * na tela por terem sido montadas por caminhos diferentes.
 */

export interface LinhaClassificada {
  inscricaoId: string
  numero: string
  proponenteNome: string
  posicao: number
  notaBase: number
  notaBonus: number
  notaFinal: number
  cotista: boolean
  status: StatusAlocacao
  finalizadas: number
  atribuidos: number
  empatado: boolean
  semAvaliacao: boolean
}

export interface CategoriaClassificada {
  nome: string
  vagasAmplaConcorrencia: number | null
  cotas: { key: string; label: string; vagas: number }[]
  valorPorProjeto: number | null
  linhas: LinhaClassificada[]
}

export interface MontarClassificacaoOptions {
  incluirBonus: boolean
  notaMinima: number | null
  maxSuplentes: number | null
  categoriasConfig: CategoriaConfig[] | null
}

const CONFIG_SEM_VAGAS_DISCRETAS = (nome: string): CategoriaConfig => ({
  nome,
  vagasAmplaConcorrencia: null,
  cotas: [],
  valorPorProjeto: null,
  valorTotalCategoria: 0,
})

export async function montarClassificacao(
  editalId: string,
  options: MontarClassificacaoOptions,
): Promise<CategoriaClassificada[]> {
  const { incluirBonus, notaMinima, maxSuplentes, categoriasConfig } = options

  const resultados = await calculateResults(editalId, { incluirBonus })
  if (resultados.length === 0) return []

  const infos = await prisma.inscricao.findMany({
    where: { id: { in: resultados.map((r) => r.inscricaoId) } },
    select: { id: true, numero: true, _count: { select: { avaliacoes: true } } },
  })
  const infoPorId = new Map(infos.map((i) => [i.id, { numero: i.numero, atribuidos: i._count.avaliacoes }]))

  const porCategoria = new Map<string, typeof resultados>()
  for (const r of resultados) {
    const chave = r.categoria ?? '—'
    if (!porCategoria.has(chave)) porCategoria.set(chave, [])
    porCategoria.get(chave)!.push(r)
  }

  const categorias: CategoriaClassificada[] = []
  for (const [nome, grupo] of [...porCategoria.entries()].sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'))) {
    const config = categoriasConfig?.find((c) => c.nome === nome) ?? CONFIG_SEM_VAGAS_DISCRETAS(nome)

    // `calculateResults` já devolve ordenado por nota desc — a alocação depende disso.
    const alocacao = alocarVagasCategoria(
      grupo.map((r) => ({
        inscricaoId: r.inscricaoId,
        notaFinal: r.notaFinal,
        totalAvaliacoes: r.totalAvaliacoes,
        cotasOptIn: r.cotasOptIn ?? [],
      })),
      config,
      notaMinima,
      maxSuplentes,
    )

    categorias.push({
      nome,
      vagasAmplaConcorrencia: config.vagasAmplaConcorrencia,
      cotas: config.cotas,
      valorPorProjeto: config.valorPorProjeto,
      linhas: grupo.map((r, i) => {
        const info = infoPorId.get(r.inscricaoId)
        const bonus = incluirBonus ? r.notaBonus : 0
        return {
          inscricaoId: r.inscricaoId,
          numero: info?.numero ?? r.numero ?? '',
          proponenteNome: r.proponenteNome,
          posicao: alocacao[i].posicaoCategoria,
          notaBase: Math.round((r.notaFinal - bonus) * 100) / 100,
          notaBonus: bonus,
          notaFinal: r.notaFinal,
          cotista: (r.cotasOptIn ?? []).length > 0,
          status: alocacao[i].status,
          finalizadas: r.totalAvaliacoes,
          atribuidos: info?.atribuidos ?? r.totalAvaliacoes,
          empatado: !!(r.empatados && r.empatados.length > 0),
          semAvaliacao: r.totalAvaliacoes === 0,
        }
      }),
    })
  }

  return categorias
}
