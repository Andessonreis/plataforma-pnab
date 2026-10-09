import type { StatusConteudo } from '@prisma/client'
import type { BadgeVariant } from '@/components/ui'

export const VARIANTE_STATUS: Record<StatusConteudo, BadgeVariant> = {
  RASCUNHO: 'neutral',
  EM_REVISAO: 'warning',
  APROVADO: 'info',
  PUBLICADO: 'success',
  ARQUIVADO: 'neutral',
}
