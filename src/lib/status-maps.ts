import type { BadgeVariant } from '@client/components/ui/badge'
import type { InscricaoStatus, EditalStatus } from '@prisma/client'

export {
  inscricaoStatusLabel,
  cumulativeStatuses,
  editalStatusLabel,
  editalCronogramaLabel,
} from '@shared/status-maps'

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
