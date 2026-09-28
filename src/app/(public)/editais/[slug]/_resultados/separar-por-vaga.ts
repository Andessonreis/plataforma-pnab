import { alocarVagasCategoria } from '@/lib/results/alocar-cotas'
import {
  modalidadesDaLinha, rotuloDeVagas, separarPorVaga,
} from '@/lib/pdf/modelo/vagas-classificacao'
import type { LinhaClassificacao } from '@/lib/pdf/modelo/tipos'
import type { LinhaResultadoPublico } from '@/lib/results/resultado-publico'
import type { CategoriaConfig } from '@/types/categoria-config'

/**
 * A lista pública de uma categoria separada por vaga, como na Relação de
 * Classificados impressa: contemplados por ampla concorrência e por cota,
 * suplentes com a modalidade em que concorrem.
 *
 * A lista publicada (e a cópia congelada do preliminar) não guarda a vaga de
 * cada contemplado, então ela é refeita aqui com a mesma alocação da
 * classificação, a partir das notas publicadas e das cotas de cada inscrição.
 * Se os contemplados refeitos não forem exatamente os publicados, a página fica
 * com a lista única — mostrar um grupo errado seria pior do que não separar.
 */

export interface GrupoPublico {
  titulo: string
  rotuloVagas: string
  linhas: LinhaResultadoPublico[]
  observacao: string | null
}

export interface CategoriaPorVaga {
  contempladas: GrupoPublico[]
  suplentes: { linha: LinhaResultadoPublico; modalidade: string }[]
  demais: LinhaResultadoPublico[]
}

export function separarResultadoPorVaga(
  linhas: LinhaResultadoPublico[],
  config: CategoriaConfig | undefined,
  cotasPorNumero: ReadonlyMap<string, string[]>,
  notaMinima: number | null,
): CategoriaPorVaga | null {
  if (!config || !config.cotas.some((c) => c.vagas > 0)) return null

  const candidatas = linhas.filter((l) => l.posicao != null && l.nota != null)
  const alocacao = alocarVagasCategoria(
    candidatas.map((l) => ({
      inscricaoId: l.numero,
      notaFinal: Number(l.nota),
      totalAvaliacoes: 1,
      cotasOptIn: cotasPorNumero.get(l.numero) ?? [],
    })),
    config, notaMinima, null,
  )
  const vagaPorNumero = new Map(alocacao.filter((a) => a.status === 'CONTEMPLADA').map((a) => [a.inscricaoId, a.vaga]))
  const publicadas = linhas.filter((l) => l.situacao === 'CONTEMPLADA').map((l) => l.numero)
  if (publicadas.length !== vagaPorNumero.size || publicadas.some((n) => !vagaPorNumero.has(n))) return null

  const linhaPorNumero = new Map(linhas.map((l) => [l.numero, l]))
  const separada = separarPorVaga({
    nome: config.nome,
    vagasAmplaConcorrencia: config.vagasAmplaConcorrencia,
    cotas: config.cotas,
    valorPorProjeto: config.valorPorProjeto,
    linhas: linhas.map((l): LinhaClassificacao => ({
      posicao: l.posicao ?? 0,
      numero: l.numero,
      proponente: l.proponente,
      notaBase: Number(l.nota ?? 0),
      notaBonus: 0,
      notaFinal: Number(l.nota ?? 0),
      cotista: (cotasPorNumero.get(l.numero) ?? []).length > 0,
      cotasOptIn: cotasPorNumero.get(l.numero) ?? [],
      vaga: vagaPorNumero.get(l.numero) ?? null,
      status: l.situacao === 'CONTEMPLADA' || l.situacao === 'SUPLENTE' ? l.situacao : 'NAO_CONTEMPLADA',
      semAvaliacao: l.nota == null,
    })),
  })
  if (!separada) return null

  const publicas = (grupo: LinhaClassificacao[]) => grupo.map((l) => linhaPorNumero.get(l.numero)!)
  return {
    contempladas: separada.contempladas.map((g) => ({
      titulo: g.titulo, rotuloVagas: rotuloDeVagas(g), linhas: publicas(g.linhas), observacao: g.observacao,
    })),
    suplentes: separada.suplentes.map((l) => ({
      linha: linhaPorNumero.get(l.numero)!, modalidade: modalidadesDaLinha(l, config.cotas),
    })),
    demais: publicas(separada.demais),
  }
}
