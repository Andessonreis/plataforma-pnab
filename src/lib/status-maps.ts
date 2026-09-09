import type { BadgeVariant } from '@/components/ui/badge'
import type { InscricaoStatus, EditalStatus, TipoProponente, UserRole } from '@prisma/client'

// ── Perfil de acesso e natureza do proponente ───────────────────────────────

export const userRoleLabel: Record<UserRole, string> = {
  PROPONENTE: 'Proponente',
  ATENDIMENTO: 'Atendimento',
  HABILITADOR: 'Habilitador',
  AVALIADOR: 'Avaliador',
  ADMIN: 'Administrador',
  SUPER_ADMIN: 'Super Administrador',
  COMUNICACAO: 'Comunicação',
}

export const tipoProponenteLabel: Record<TipoProponente, string> = {
  PF: 'Pessoa física',
  MEI: 'MEI',
  PJ: 'Pessoa jurídica',
  COLETIVO: 'Coletivo',
}

// ── Inscricao Status ────────────────────────────────────────────────────────

export const inscricaoStatusLabel: Record<InscricaoStatus, string> = {
  RASCUNHO: 'Rascunho',
  ENVIADA: 'Enviada',
  HABILITADA: 'Habilitada',
  INABILITADA: 'Inabilitada',
  EM_AVALIACAO: 'Em Avaliação',
  RESULTADO_PRELIMINAR: 'Resultado Preliminar',
  RECURSO_ABERTO: 'Recurso Aberto',
  RESULTADO_FINAL: 'Resultado Final',
  CONTEMPLADA: 'Contemplada',
  NAO_CONTEMPLADA: 'Não Contemplada',
  SUPLENTE: 'Suplente',
}

/**
 * Rótulos como o proponente vê.
 *
 * Pra quem se inscreveu, "Enviada" e "em análise" são o mesmo momento — e é
 * esse o rótulo que a inscrição mantém enquanto o resultado da habilitação
 * não é publicado, já que o status real fica mascarado até lá.
 */
export const inscricaoStatusLabelProponente: Record<InscricaoStatus, string> = {
  ...inscricaoStatusLabel,
  ENVIADA: 'Em análise',
}

export const inscricaoStatusVariant: Record<InscricaoStatus, BadgeVariant> = {
  RASCUNHO: 'neutral',
  ENVIADA: 'info',
  HABILITADA: 'success',
  INABILITADA: 'error',
  EM_AVALIACAO: 'warning',
  RESULTADO_PRELIMINAR: 'info',
  RECURSO_ABERTO: 'warning',
  RESULTADO_FINAL: 'info',
  CONTEMPLADA: 'success',
  NAO_CONTEMPLADA: 'error',
  SUPLENTE: 'warning',
}

// ── Listas cumulativas ─────────────────────────────────────────────────────
// Ao gerar "Lista de Habilitados", inclui todos que passaram pela habilitação
// (mesmo que já estejam em fases posteriores como Contemplada).
// Status terminais (Inabilitada, Contemplada, etc.) usam correspondência exata.

export const cumulativeStatuses: Record<InscricaoStatus, InscricaoStatus[]> = {
  RASCUNHO: ['RASCUNHO'],
  ENVIADA: ['ENVIADA'],
  HABILITADA: ['HABILITADA', 'EM_AVALIACAO', 'RESULTADO_PRELIMINAR', 'RECURSO_ABERTO', 'RESULTADO_FINAL', 'CONTEMPLADA', 'NAO_CONTEMPLADA', 'SUPLENTE'],
  INABILITADA: ['INABILITADA'],
  EM_AVALIACAO: ['EM_AVALIACAO', 'RESULTADO_PRELIMINAR', 'RECURSO_ABERTO', 'RESULTADO_FINAL', 'CONTEMPLADA', 'NAO_CONTEMPLADA', 'SUPLENTE'],
  RESULTADO_PRELIMINAR: ['RESULTADO_PRELIMINAR', 'RECURSO_ABERTO', 'RESULTADO_FINAL', 'CONTEMPLADA', 'NAO_CONTEMPLADA', 'SUPLENTE'],
  RECURSO_ABERTO: ['RECURSO_ABERTO'],
  RESULTADO_FINAL: ['RESULTADO_FINAL', 'CONTEMPLADA', 'NAO_CONTEMPLADA', 'SUPLENTE'],
  CONTEMPLADA: ['CONTEMPLADA'],
  NAO_CONTEMPLADA: ['NAO_CONTEMPLADA'],
  SUPLENTE: ['SUPLENTE'],
}

// ── Edital Status ───────────────────────────────────────────────────────────

export const editalStatusLabel: Record<EditalStatus, string> = {
  RASCUNHO: 'Rascunho',
  PUBLICADO: 'Publicado',
  INSCRICOES_ABERTAS: 'Inscrições Abertas',
  INSCRICOES_ENCERRADAS: 'Inscrições Encerradas',
  HABILITACAO: 'Habilitação',
  AVALIACAO: 'Avaliação',
  RESULTADO_PRELIMINAR: 'Resultado Preliminar',
  RECURSO: 'Recurso',
  RESULTADO_FINAL: 'Resultado Final',
  ENCERRADO: 'Encerrado',
}

export const editalCronogramaLabel: Record<EditalStatus, string> = {
  RASCUNHO: 'Rascunho',
  PUBLICADO: 'Publicação do Edital',
  INSCRICOES_ABERTAS: 'Início das Inscrições',
  INSCRICOES_ENCERRADAS: 'Encerramento das Inscrições',
  HABILITACAO: 'Início da Habilitação',
  AVALIACAO: 'Início da Avaliação',
  RESULTADO_PRELIMINAR: 'Publicação do Resultado Preliminar',
  RECURSO: 'Início da Fase de Recursos',
  RESULTADO_FINAL: 'Publicação do Resultado Final',
  ENCERRADO: 'Encerramento do Edital',
}

export const editalStatusVariant: Record<EditalStatus, BadgeVariant> = {
  RASCUNHO: 'neutral',
  PUBLICADO: 'info',
  INSCRICOES_ABERTAS: 'success',
  INSCRICOES_ENCERRADAS: 'warning',
  HABILITACAO: 'info',
  AVALIACAO: 'warning',
  RESULTADO_PRELIMINAR: 'info',
  RECURSO: 'warning',
  RESULTADO_FINAL: 'info',
  ENCERRADO: 'neutral',
}
