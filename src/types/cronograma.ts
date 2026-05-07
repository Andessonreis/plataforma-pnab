import type { EditalStatus } from '@prisma/client'

// ── Discriminated union: fase fixa OU item custom ───────────────────────────

export interface CronogramaFaseItem {
  tipo: 'fase'
  fase: EditalStatus
  dataHora: string
}

// Ações que items custom podem disparar/janelar.
// Usadas pra gating de funcionalidades por janela temporal:
//   - RECURSO_HABILITACAO_JANELA: libera form de recurso fase HABILITACAO
//   - RECURSO_RESULTADO_JANELA:   libera form de recurso fase RESULTADO_PRELIMINAR
// Outras ações futuras podem ser adicionadas sem mudar schema.
export type AcaoJanela =
  | 'RECURSO_HABILITACAO_JANELA'
  | 'RECURSO_RESULTADO_JANELA'

export interface CronogramaCustomItem {
  tipo: 'custom'
  label: string
  dataHora: string
  /** Fim da janela. Se ausente, o item é um marco pontual (sem range). */
  fimEm?: string
  /** Ação opcional disparada/janelada por este item. */
  acao?: AcaoJanela
}

export type CronogramaItem = CronogramaFaseItem | CronogramaCustomItem

// Item do formulário com ID efêmero para drag & drop (@dnd-kit)
export type CronogramaFormItem = CronogramaItem & { id: string }

// Warning de validação de ordem cronológica
export interface CronogramaValidationWarning {
  itemId: string
  fase?: EditalStatus
  message: string
  /** Fase anterior que deveria ter data menor */
  anteriorFase?: EditalStatus
}

// Item legado (formato antigo, sem campo `tipo`)
export interface CronogramaLegacyItem {
  label: string
  dataHora: string
}

// Item para exibição (já com label resolvido)
export interface CronogramaDisplayItem {
  label: string
  dataHora: string
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

// ── Fases automatizáveis pelo scheduler ─────────────────────────────────────

export const FASES_AUTOMATIZAVEIS: EditalStatus[] = [
  'INSCRICOES_ABERTAS',
  'INSCRICOES_ENCERRADAS',
  'HABILITACAO',
  'AVALIACAO',
  'RESULTADO_PRELIMINAR',       // → RECURSO
  'RESULTADO_FINAL',            // → ENCERRADO (na prática: RECURSO → nada, mas RESULTADO_FINAL pode)
]

// ── Mapa de transições automáticas ──────────────────────────────────────────

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

// Status que o scheduler deve buscar para verificar transições
export const STATUS_ELEGIVEIS_SCHEDULER: EditalStatus[] = [
  'PUBLICADO',
  'INSCRICOES_ABERTAS',
  'INSCRICOES_ENCERRADAS',
  'HABILITACAO',
  'AVALIACAO',
  'RESULTADO_PRELIMINAR',
  'RECURSO',
  'RESULTADO_FINAL',
]
