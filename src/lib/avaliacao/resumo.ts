import { viewNotaTotal } from '@/lib/services/avaliacao-view'
import { lerRevisaoRecurso, mediaAnterior, mediaMudou, mesmaNota } from './revisao-recurso'

interface AvaliacaoDoResumo {
  finalizada: boolean
  notaTotal: unknown
  revisaoRecurso?: unknown
}

/** Média das avaliações finalizadas e, havendo revisão de recurso, a média de antes dela. */
function medias(avaliacoes: AvaliacaoDoResumo[]): { media: number | null; antes: number | null } {
  const finalizadasComNota = avaliacoes
    .map((a) => ({ pontuacao: viewNotaTotal(a), revisao: lerRevisaoRecurso(a.revisaoRecurso) }))
    .filter((a): a is { pontuacao: number; revisao: ReturnType<typeof lerRevisaoRecurso> } => a.pontuacao !== null)

  const media = finalizadasComNota.length > 0
    ? finalizadasComNota.reduce((soma, a) => soma + a.pontuacao, 0) / finalizadasComNota.length
    : null
  const antes = mediaAnterior(
    finalizadasComNota.map((a) => ({ pontuacao: a.pontuacao, anterior: a.revisao?.notaTotalAnterior ?? null })),
  )
  return { media, antes }
}

/**
 * Resumo das avaliações de uma inscrição: atribuídos, finalizadas e nota média
 * (só finalizadas). Quando a comissão revisou alguma avaliação no julgamento do
 * recurso, traz também a média de antes, para a lista mostrá-la riscada.
 */
export function resumoAvaliacoes(avaliacoes: AvaliacaoDoResumo[]) {
  const { media, antes } = medias(avaliacoes)

  return {
    atribuidos: avaliacoes.length,
    finalizadas: avaliacoes.filter((a) => a.finalizada).length,
    media: media === null ? null : media.toFixed(2),
    mediaAnterior: mediaMudou(antes, media) && antes !== null ? antes.toFixed(2) : null,
  }
}

export interface NotaFinalRevisada {
  anterior: number
  atual: number
}

/**
 * Antes e depois da revisão do recurso para a nota final gravada na inscrição.
 *
 * A nota gravada só muda quando o resultado é aplicado, então em qualquer dia
 * ela está de um dos dois lados da revisão: ainda igual à média de antes ou já
 * igual à média de agora. Qualquer outro valor (ex.: com bonificação somada)
 * não dá para comparar com segurança, e devolve null para a tela mostrar a nota
 * gravada como está.
 */
export function notaFinalRevisada(notaFinal: number, avaliacoes: AvaliacaoDoResumo[]): NotaFinalRevisada | null {
  const { media, antes } = medias(avaliacoes)
  if (media === null || antes === null || !mediaMudou(antes, media)) return null

  if (mesmaNota(notaFinal, antes)) return { anterior: notaFinal, atual: media }
  if (mesmaNota(notaFinal, media)) return { anterior: antes, atual: notaFinal }
  return null
}
