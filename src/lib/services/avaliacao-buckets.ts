import type { InscricaoStatus, EditalStatus, Prisma } from '@prisma/client'

/**
 * Classificação das inscrições na fase de avaliação derivada do progresso real
 * das avaliações (atribuídos × finalizadas), e não do enum de status — que pode
 * ficar defasado quando avaliações são lançadas sem transicionar a inscrição.
 *
 * - aguardando:   habilitada/em avaliação, sem avaliador atribuído.
 * - em_avaliacao: tem avaliador atribuído, mas ainda há avaliação pendente (rascunho).
 * - avaliadas:    todas as avaliações atribuídas finalizadas (ou resultado já publicado).
 */

export type BucketAvaliacao = 'aguardando' | 'em_avaliacao' | 'avaliadas'

/** Inscrições no universo da avaliação (habilitadas e em avaliação). */
export const STATUS_EM_PROCESSO_AVALIACAO: InscricaoStatus[] = ['HABILITADA', 'EM_AVALIACAO']

/** Inscrições cujo resultado já foi publicado — consideradas avaliadas. */
export const STATUS_RESULTADO_PUBLICADO: InscricaoStatus[] = [
  'RESULTADO_PRELIMINAR',
  'RECURSO_ABERTO',
  'RESULTADO_FINAL',
  'CONTEMPLADA',
  'NAO_CONTEMPLADA',
  'SUPLENTE',
]

/** Editais que alcançaram (ou já passaram da) fase de avaliação. */
export const EDITAL_STATUS_COM_AVALIACAO: EditalStatus[] = [
  'AVALIACAO',
  'RESULTADO_PRELIMINAR',
  'RECURSO',
  'RESULTADO_FINAL',
  'ENCERRADO',
]

/** Filtro Prisma para cada aba, baseado no progresso efetivo das avaliações. */
export function whereBucket(bucket: BucketAvaliacao): Prisma.InscricaoWhereInput {
  switch (bucket) {
    case 'aguardando':
      return {
        status: { in: STATUS_EM_PROCESSO_AVALIACAO },
        avaliacoes: { none: {} },
      }
    case 'em_avaliacao':
      return {
        status: { in: STATUS_EM_PROCESSO_AVALIACAO },
        avaliacoes: { some: { finalizada: false } },
      }
    case 'avaliadas':
      return {
        OR: [
          { status: { in: STATUS_RESULTADO_PUBLICADO } },
          {
            status: { in: STATUS_EM_PROCESSO_AVALIACAO },
            avaliacoes: { some: {}, none: { finalizada: false } },
          },
        ],
      }
  }
}

/** Classifica uma inscrição já carregada (com as avaliações) numa aba. */
export function classificarInscricao(
  status: InscricaoStatus,
  avaliacoes: { finalizada: boolean }[],
): BucketAvaliacao {
  if (STATUS_RESULTADO_PUBLICADO.includes(status)) return 'avaliadas'
  if (avaliacoes.length === 0) return 'aguardando'
  return avaliacoes.every((a) => a.finalizada) ? 'avaliadas' : 'em_avaliacao'
}
