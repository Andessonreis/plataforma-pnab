import type { EditalStatus } from '@prisma/client'
import { Carimbo, type TomCarimbo } from '@/components/ui/carimbo'
import { CLOSED_STATUSES } from '@/lib/utils/edital-status'

interface CarimboStatusProps {
  status: EditalStatus
  label: string
  className?: string
}

function tomDoStatus(status: EditalStatus): TomCarimbo {
  if (status === 'INSCRICOES_ABERTAS') return 'safra'
  if (CLOSED_STATUSES.includes(status)) return 'arquivo'
  return 'curso'
}

/** Situação do edital, traduzida para o tom de carimbo correspondente. */
export function CarimboStatus({ status, label, className }: CarimboStatusProps) {
  return (
    <Carimbo tom={tomDoStatus(status)} className={className}>
      {label}
    </Carimbo>
  )
}
