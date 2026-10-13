import type { StatusConteudo } from '@prisma/client'
import { Badge, type BadgeVariant } from '@/components/ui'
import { ROTULO_STATUS } from '@/lib/memorial/rotulos'

const VARIANTE: Record<StatusConteudo, BadgeVariant> = {
  RASCUNHO: 'neutral',
  EM_REVISAO: 'warning',
  APROVADO: 'info',
  PUBLICADO: 'success',
  ARQUIVADO: 'neutral',
}

export function SeloStatus({ status }: { status: StatusConteudo }) {
  return <Badge variant={VARIANTE[status]}>{ROTULO_STATUS[status]}</Badge>
}
