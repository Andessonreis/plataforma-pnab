import type { EditalStatus } from '@prisma/client'

// ── Discriminated union: fase fixa OU item custom ───────────────────────────

export interface CronogramaFaseItem {
  tipo: 'fase'
  fase: EditalStatus
  dataHora: string
  destaque?: boolean
}

export interface CronogramaCustomItem {
  tipo: 'custom'
  label: string
  dataHora: string
  destaque?: boolean
}

export type CronogramaItem = CronogramaFaseItem | CronogramaCustomItem

// Item legado (formato antigo, sem campo `tipo`)
export interface CronogramaLegacyItem {
  label: string
  dataHora: string
  destaque?: boolean
}

// Item para exibição (já com label resolvido)
export interface CronogramaDisplayItem {
  label: string
  dataHora: string
  destaque?: boolean
  /** Fase do edital (presente se o item veio de uma fase fixa, ausente em custom/legado) */
  fase?: EditalStatus
}

// ── Fases do ciclo de vida do edital (sem RASCUNHO) ─────────────────────────

export const CRONOGRAMA_FASES_ORDENADAS: EditalStatus[] = [
  'PUBLICADO',
  'INSCRICOES_ABERTAS',
  'INSCRICOES_ENCERRADAS',
  'HABILITACAO',
  'AVALIACAO',
  'RESULTADO_PRELIMINAR',
  'RECURSO',
  'RESULTADO_FINAL',
  'ENCERRADO',
]

/**
 * Fases que aparecem no formulário de cronograma.
 * Exclui PUBLICADO porque a publicação é ação manual do admin
 * (a data de publicação é quando o admin muda o status para PUBLICADO).
 */
export const CRONOGRAMA_FASES_FORMULARIO: EditalStatus[] = [
  'INSCRICOES_ABERTAS',
  'INSCRICOES_ENCERRADAS',
  'HABILITACAO',
  'AVALIACAO',
  'RESULTADO_PRELIMINAR',
  'RECURSO',
  'RESULTADO_FINAL',
  'ENCERRADO',
]

// ── Fases automatizáveis pelo scheduler (relógio) ──────────────────────────
// Apenas fases públicas com deadline rígido são automáticas.

export const FASES_AUTOMATICAS: EditalStatus[] = [
  'INSCRICOES_ABERTAS',     // PUBLICADO → INSCRICOES_ABERTAS (data de abertura)
  'INSCRICOES_ENCERRADAS',  // INSCRICOES_ABERTAS → INSCRICOES_ENCERRADAS (deadline 23:59)
]

// ── Fases manuais (botão do Admin) ──────────────────────────────────────────
// Fases internas que dependem do trabalho humano.

export const FASES_MANUAIS: EditalStatus[] = [
  'HABILITACAO',            // INSCRICOES_ENCERRADAS → HABILITACAO
  'AVALIACAO',              // HABILITACAO → AVALIACAO
  'RESULTADO_PRELIMINAR',   // AVALIACAO → RESULTADO_PRELIMINAR
  'RECURSO',                // RESULTADO_PRELIMINAR → RECURSO
  'RESULTADO_FINAL',        // RECURSO → RESULTADO_FINAL
  'ENCERRADO',              // RESULTADO_FINAL → ENCERRADO
]

/** @deprecated Use FASES_AUTOMATICAS para o scheduler. Mantido para backward compat. */
export const FASES_AUTOMATIZAVEIS: EditalStatus[] = [
  ...FASES_AUTOMATICAS,
  ...FASES_MANUAIS,
]

// ── Mapa COMPLETO de transições (auto + manual) ────────────────────────────

export interface FaseTransicao {
  de: EditalStatus
  para: EditalStatus
}

export const FASE_TRANSICOES: Partial<Record<EditalStatus, FaseTransicao>> = {
  INSCRICOES_ABERTAS: { de: 'PUBLICADO', para: 'INSCRICOES_ABERTAS' },
  INSCRICOES_ENCERRADAS: { de: 'INSCRICOES_ABERTAS', para: 'INSCRICOES_ENCERRADAS' },
  HABILITACAO: { de: 'INSCRICOES_ENCERRADAS', para: 'HABILITACAO' },
  AVALIACAO: { de: 'HABILITACAO', para: 'AVALIACAO' },
  RESULTADO_PRELIMINAR: { de: 'AVALIACAO', para: 'RESULTADO_PRELIMINAR' },
  RECURSO: { de: 'RESULTADO_PRELIMINAR', para: 'RECURSO' },
  RESULTADO_FINAL: { de: 'RECURSO', para: 'RESULTADO_FINAL' },
  ENCERRADO: { de: 'RESULTADO_FINAL', para: 'ENCERRADO' },
}

// Apenas transições controladas pelo scheduler (relógio)
export const TRANSICOES_AUTOMATICAS: Partial<Record<EditalStatus, FaseTransicao>> = {
  INSCRICOES_ABERTAS: FASE_TRANSICOES.INSCRICOES_ABERTAS!,
  INSCRICOES_ENCERRADAS: FASE_TRANSICOES.INSCRICOES_ENCERRADAS!,
}

// Transições acionadas pelo Admin via botão
export const TRANSICOES_MANUAIS: Partial<Record<EditalStatus, FaseTransicao>> = {
  HABILITACAO: FASE_TRANSICOES.HABILITACAO!,
  AVALIACAO: FASE_TRANSICOES.AVALIACAO!,
  RESULTADO_PRELIMINAR: FASE_TRANSICOES.RESULTADO_PRELIMINAR!,
  RECURSO: FASE_TRANSICOES.RECURSO!,
  RESULTADO_FINAL: FASE_TRANSICOES.RESULTADO_FINAL!,
  ENCERRADO: FASE_TRANSICOES.ENCERRADO!,
}

// Status que o scheduler deve buscar (apenas os automáticos)
export const STATUS_ELEGIVEIS_SCHEDULER: EditalStatus[] = [
  'PUBLICADO',
  'INSCRICOES_ABERTAS',
]
