import type { InscricaoStatus } from '@prisma/client'
import type { BadgeVariant } from '@/components/ui/badge'
import { inscricaoStatusVariant } from '@/lib/status-maps'
import type { TomCarimbo } from '@/components/ui/carimbo'

/**
 * Deriva o tom do carimbo a partir da classificação semântica que já existe
 * em `inscricaoStatusVariant` — não reclassifica os status, só troca a
 * representação visual (pílula colorida → carimbo da identidade).
 */
const TOM_POR_VARIANTE: Record<BadgeVariant, TomCarimbo> = {
  success: 'safra',
  error: 'arquivo',
  warning: 'curso',
  info: 'curso',
  neutral: 'arquivo',
}

export function tomCarimboDeStatus(status: InscricaoStatus): TomCarimbo {
  return TOM_POR_VARIANTE[inscricaoStatusVariant[status]]
}
