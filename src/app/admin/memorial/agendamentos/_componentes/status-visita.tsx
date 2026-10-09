import type { MemorialStatusAgendamento } from '@prisma/client'
import { Badge, type BadgeVariant } from '@/components/ui'
import { ROTULO_STATUS } from '@/lib/memorial/agendamento/status'

const VARIANTE: Record<MemorialStatusAgendamento, BadgeVariant> = {
  SOLICITADO: 'warning',
  EM_ANALISE: 'info',
  REAGENDAMENTO_SOLICITADO: 'warning',
  CONFIRMADO: 'success',
  REALIZADO: 'neutral',
  NAO_COMPARECEU: 'error',
  RECUSADO: 'error',
  CANCELADO: 'neutral',
}

export function StatusVisita({ status }: { status: MemorialStatusAgendamento }) {
  return <Badge variant={VARIANTE[status]}>{ROTULO_STATUS[status]}</Badge>
}
