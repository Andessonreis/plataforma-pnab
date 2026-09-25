import { viewNotaTotal } from '@/lib/services/avaliacao-view'
import { lerRevisaoRecurso, mediaAnterior } from './revisao-recurso'

interface AvaliacaoDoResumo {
  finalizada: boolean
  notaTotal: unknown
  revisaoRecurso?: unknown
}

/**
 * Resumo das avaliações de uma inscrição: atribuídos, finalizadas e nota média
 * (só finalizadas). Quando a comissão revisou alguma avaliação no julgamento do
 * recurso, traz também a média de antes, para a lista mostrá-la riscada.
 */
export function resumoAvaliacoes(avaliacoes: AvaliacaoDoResumo[]) {
  const atribuidos = avaliacoes.length
  const finalizadas = avaliacoes.filter((a) => a.finalizada).length
  const finalizadasComNota = avaliacoes
    .map((a) => ({ pontuacao: viewNotaTotal(a), revisao: lerRevisaoRecurso(a.revisaoRecurso) }))
    .filter((a): a is { pontuacao: number; revisao: ReturnType<typeof lerRevisaoRecurso> } => a.pontuacao !== null)

  const media = finalizadasComNota.length > 0
    ? finalizadasComNota.reduce((soma, a) => soma + a.pontuacao, 0) / finalizadasComNota.length
    : null
  const antes = mediaAnterior(
    finalizadasComNota.map((a) => ({ pontuacao: a.pontuacao, anterior: a.revisao?.notaTotalAnterior ?? null })),
  )
  const mudou = antes !== null && media !== null && Math.abs(antes - media) > 0.004

  return {
    atribuidos,
    finalizadas,
    media: media === null ? null : media.toFixed(2),
    mediaAnterior: mudou && antes !== null ? antes.toFixed(2) : null,
  }
}
