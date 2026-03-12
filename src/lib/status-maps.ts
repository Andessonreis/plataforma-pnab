import type { BadgeVariant } from '@/components/ui/badge'
import type { InscricaoStatus, EditalStatus } from '@prisma/client'

// ── Inscricao Status ────────────────────────────────────────────────────────

export const inscricaoStatusLabel: Record<InscricaoStatus, string> = {
  RASCUNHO: 'Rascunho',
  ENVIADA: 'Enviada',
  HABILITADA: 'Habilitada',
  INABILITADA: 'Inabilitada',
  EM_AVALIACAO: 'Em Avaliacao',
  RESULTADO_PRELIMINAR: 'Resultado Preliminar',
  RECURSO_ABERTO: 'Recurso Aberto',
  RESULTADO_FINAL: 'Resultado Final',
  CONTEMPLADA: 'Contemplada',
  NAO_CONTEMPLADA: 'Nao Contemplada',
  SUPLENTE: 'Suplente',
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

// ── Edital Status ───────────────────────────────────────────────────────────

export const editalStatusLabel: Record<EditalStatus, string> = {
  RASCUNHO: 'Rascunho',
  PUBLICADO: 'Publicado',
  INSCRICOES_ABERTAS: 'Inscricoes Abertas',
  INSCRICOES_ENCERRADAS: 'Inscricoes Encerradas',
  HABILITACAO: 'Habilitacao',
  AVALIACAO: 'Avaliacao',
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
