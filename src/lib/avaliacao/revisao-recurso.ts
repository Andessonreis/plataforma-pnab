/**
 * Revisão de uma avaliação feita pela comissão ao julgar um recurso.
 *
 * A avaliação guarda os valores de antes (`Avaliacao.revisaoRecurso`) e as telas
 * os mostram riscados ao lado dos novos, como a retificação faz com as datas.
 * Funções puras: quem desenha decide o que fazer com o que sai daqui.
 */

export interface NotaRevisada {
  criterio: string
  nota: number
  peso?: number
}

export interface RevisaoRecurso {
  revisadoEm: string
  notasAnteriores: NotaRevisada[]
  notaTotalAnterior: number
}

function ehNota(bruto: unknown): bruto is NotaRevisada {
  if (typeof bruto !== 'object' || bruto === null) return false
  const { criterio, nota } = bruto as Partial<NotaRevisada>
  return typeof criterio === 'string' && typeof nota === 'number' && Number.isFinite(nota)
}

/** Lê o JSON do banco; devolve null quando não existe ou não tem a forma esperada. */
export function lerRevisaoRecurso(bruto: unknown): RevisaoRecurso | null {
  if (typeof bruto !== 'object' || bruto === null) return null
  const { revisadoEm, notasAnteriores, notaTotalAnterior } = bruto as Partial<RevisaoRecurso>
  if (typeof revisadoEm !== 'string' || !Array.isArray(notasAnteriores)) return null
  if (typeof notaTotalAnterior !== 'number' || !Number.isFinite(notaTotalAnterior)) return null
  return { revisadoEm, notasAnteriores: notasAnteriores.filter(ehNota), notaTotalAnterior }
}

/**
 * Duas notas valem o mesmo quando diferem menos que meio centésimo: a nota
 * final é gravada com duas casas, e a média calculada na hora não.
 */
export function mesmaNota(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.006
}

/** A revisão mudou a média: há valor de antes e ele difere do atual. */
export function mediaMudou(antes: number | null, atual: number | null): boolean {
  return antes !== null && atual !== null && !mesmaNota(antes, atual)
}

/** Nota que o critério tinha antes da revisão, só quando ela mudou; senão null. */
export function notaAnteriorDoCriterio(
  revisao: RevisaoRecurso | null,
  criterio: string,
  notaAtual: number | undefined,
): number | null {
  if (!revisao || notaAtual === undefined) return null
  const anterior = revisao.notasAnteriores.find((n) => n.criterio === criterio)?.nota
  return anterior !== undefined && anterior !== notaAtual ? anterior : null
}

/**
 * Média das pontuações antes das revisões: cada avaliação entra com o valor
 * anterior quando foi revisada e com o atual quando não foi. Devolve null se
 * nenhuma avaliação foi revisada ou se falta pontuação em alguma.
 */
export function mediaAnterior(
  avaliacoes: { pontuacao: number | null; anterior: number | null }[],
): number | null {
  if (avaliacoes.every((a) => a.anterior === null)) return null
  const valores = avaliacoes.map((a) => a.anterior ?? a.pontuacao)
  if (valores.length === 0 || valores.some((v) => v === null)) return null
  return (valores as number[]).reduce((soma, v) => soma + v, 0) / valores.length
}

/**
 * Pontuação bruta (soma dos critérios exibidos) de cada avaliação antes da
 * revisão; null para a que não foi revisada ou cuja soma não mudou.
 */
export function brutasAnteriores(
  criterios: string[],
  notasAtuais: Map<string, number>[],
  revisoes: (RevisaoRecurso | null)[],
): (number | null)[] {
  return revisoes.map((revisao, i) => {
    if (!revisao) return null
    const atual = criterios.reduce((soma, c) => soma + (notasAtuais[i].get(c) ?? 0), 0)
    const anterior = criterios.reduce(
      (soma, c) => soma + (notaAnteriorDoCriterio(revisao, c, notasAtuais[i].get(c)) ?? notasAtuais[i].get(c) ?? 0),
      0,
    )
    return anterior !== atual ? anterior : null
  })
}
