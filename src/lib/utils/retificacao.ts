import type { CronogramaItem } from '@/types/cronograma'
import type { MarcoAlteracao, Retificacao } from '@/types/retificacao'
import { editalCronogramaLabel } from '@/lib/status-maps'
import { migrateLegacyCronograma } from './cronograma'
import { parseBrazilDateTime } from './format'

/**
 * Normaliza a data do ato para uma data-hora completa.
 *
 * O campo é preenchido por um `input type="date"`, que entrega "2026-09-05".
 * `parseBrazilDateTime` monta a string com o fuso do Brasil no fim, e
 * "2026-09-05-03:00" não é data válida — sem isto a faixa pública anunciaria
 * "publicada no Diário Oficial em —" e a ordenação por data cairia em NaN,
 * deixando o ato mais recente atrás do mais antigo.
 */
export function normalizarDataAto(valor: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(valor) ? `${valor}T00:00:00` : valor
}

/**
 * Lê o campo `retificacoes` do edital, que vem do banco como `Json` e pode
 * chegar como array, string ou null conforme a origem (Prisma, cache, seed).
 */
export function parseRetificacoes(raw: unknown): Retificacao[] {
  let data = raw
  if (typeof data === 'string') {
    try { data = JSON.parse(data) } catch { return [] }
  }
  if (!Array.isArray(data)) return []

  return data
    .filter(
      (item): item is Retificacao =>
        typeof item === 'object'
        && item !== null
        && typeof (item as Retificacao).numero === 'string'
        && typeof (item as Retificacao).publicadoEm === 'string'
        && typeof (item as Retificacao).resumo === 'string',
    )
    .map((item) => ({ ...item, publicadoEm: normalizarDataAto(item.publicadoEm) }))
}

/**
 * A retificação que o portal exibe na faixa vermelha: a mais recente por
 * data de publicação no Diário Oficial. Um edital pode acumular vários
 * atos, mas a faixa mostra o último — quem quiser o histórico completo
 * encontra todos listados abaixo dela.
 */
export function retificacaoVigente(raw: unknown): Retificacao | null {
  const todas = parseRetificacoes(raw)
  if (todas.length === 0) return null

  return [...todas].sort(
    (a, b) => parseBrazilDateTime(b.publicadoEm).getTime() - parseBrazilDateTime(a.publicadoEm).getTime(),
  )[0]
}

/** Ordena da mais recente para a mais antiga — ordem de leitura do histórico. */
export function retificacoesOrdenadas(raw: unknown): Retificacao[] {
  return [...parseRetificacoes(raw)].sort(
    (a, b) => parseBrazilDateTime(b.publicadoEm).getTime() - parseBrazilDateTime(a.publicadoEm).getTime(),
  )
}

/**
 * Aplica as novas datas ao cronograma, carimbando em cada marco alterado a
 * data que valia antes.
 *
 * O carimbo é o que sustenta as duas coisas que a retificação precisa: a
 * página riscar a data velha ao lado da nova, e o ato poder ser desfeito
 * restaurando exatamente o estado anterior. Por isso ele grava a data
 * imediatamente anterior — não a data de origem do edital. Num segundo ato
 * sobre o mesmo marco, o carimbo antigo é substituído pelo penúltimo valor,
 * que é como a retificação se lê no Diário: "onde se lê X, leia-se Y".
 *
 * Marcos cuja data nova é igual à atual são ignorados — não faz sentido
 * riscar uma data para reescrever a mesma data.
 */
export function aplicarRetificacao(
  cronogramaRaw: unknown,
  numeroRetificacao: string,
  alteracoes: MarcoAlteracao[],
): CronogramaItem[] {
  const itens = migrateLegacyCronograma(cronogramaRaw)
  const porIndice = new Map(alteracoes.map((a) => [a.indice, a]))

  return itens.map((item, indice) => {
    const alteracao = porIndice.get(indice)
    if (!alteracao) return item

    const mudouData = alteracao.dataHora !== item.dataHora
    const fimAtual = item.tipo === 'custom' ? item.fimEm : undefined
    const mudouFim = (alteracao.fimEm ?? undefined) !== (fimAtual ?? undefined)
    if (!mudouData && !mudouFim) return item

    const carimbo = {
      dataHoraAnterior: item.dataHora,
      ...(fimAtual ? { fimEmAnterior: fimAtual } : {}),
      retificacaoNumero: numeroRetificacao,
    }

    if (item.tipo === 'custom') {
      const { fimEm: _descartado, ...resto } = item
      return {
        ...resto,
        dataHora: alteracao.dataHora,
        ...(alteracao.fimEm ? { fimEm: alteracao.fimEm } : {}),
        retificado: carimbo,
      }
    }

    return { ...item, dataHora: alteracao.dataHora, retificado: carimbo }
  })
}

/**
 * Desfaz uma retificação: devolve cada marco carimbado com aquele número à
 * data que tinha antes e remove o carimbo.
 *
 * Existe porque uma retificação é lançada a partir do Diário Oficial, e erro
 * de digitação em data publicada é o tipo de engano que aparece depois de
 * salvo. Sem desfazer, a única saída seria reescrever as datas à mão e
 * conviver com um risco na tela apontando para uma data que nunca existiu.
 */
export function reverterRetificacao(
  cronogramaRaw: unknown,
  numeroRetificacao: string,
): CronogramaItem[] {
  const itens = migrateLegacyCronograma(cronogramaRaw)

  return itens.map((item) => {
    if (item.retificado?.retificacaoNumero !== numeroRetificacao) return item

    const { dataHoraAnterior, fimEmAnterior } = item.retificado

    if (item.tipo === 'custom') {
      const { retificado: _carimbo, fimEm: _descartado, ...resto } = item
      return {
        ...resto,
        dataHora: dataHoraAnterior,
        ...(fimEmAnterior ? { fimEm: fimEmAnterior } : {}),
      }
    }

    const { retificado: _carimbo, ...resto } = item
    return { ...resto, dataHora: dataHoraAnterior }
  })
}

/** Remove um ato da lista de retificações do edital. */
export function removerRetificacao(raw: unknown, numero: string): Retificacao[] {
  return parseRetificacoes(raw).filter((r) => r.numero !== numero)
}

/** Um marco do cronograma como o painel de retificação precisa exibi-lo. */
export interface MarcoEditavel {
  /** Posição no array do cronograma — é por ele que o service localiza o marco. */
  indice: number
  label: string
  dataHora: string
  fimEm?: string
  /** Número do ato que já alterou este marco, quando houver. */
  retificadoPor?: string
}

/**
 * Lista os marcos para o painel do admin.
 *
 * O índice vem de `migrateLegacyCronograma`, o mesmo normalizador que
 * `aplicarRetificacao` usa ao gravar. Manter as duas leituras na mesma base é
 * o que impede o painel de apontar para um marco e o salvamento alterar outro
 * num edital que ainda esteja no formato legado.
 */
export function marcosEditaveis(cronogramaRaw: unknown): MarcoEditavel[] {
  return migrateLegacyCronograma(cronogramaRaw).map((item, indice) => ({
    indice,
    label: item.tipo === 'fase' ? editalCronogramaLabel[item.fase] : item.label,
    dataHora: item.dataHora,
    ...(item.tipo === 'custom' && item.fimEm ? { fimEm: item.fimEm } : {}),
    ...(item.retificado ? { retificadoPor: item.retificado.retificacaoNumero } : {}),
  }))
}
