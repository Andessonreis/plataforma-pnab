import { prisma } from '@/lib/db'
import type { TriggerContext, TriggerResult, EditalPublicadoConfig } from '../types'

/**
 * Trigger: EDITAL_PUBLICADO
 *
 * Disparado sob demanda quando um edital transiciona pra status PUBLICADO/INSCRICOES_ABERTAS.
 * Chamador passa `editalId` no event/config.
 *
 * Audiência padrão: usuários ativos com role PROPONENTE sem inscrição neste edital
 * (e que se encaixem no filtro adicional da regra, aplicado no dispatch).
 */
export async function editalPublicadoExecutor(ctx: TriggerContext): Promise<TriggerResult> {
  const config = ctx.ruleConfig as EditalPublicadoConfig
  const editalId = config.editalId ?? (ctx.event?.editalId as string | undefined)

  if (!editalId) {
    return { userIds: [] }
  }

  // Default: todos proponentes ativos que ainda não se inscreveram no edital.
  // Filtros adicionais da regra são combinados via dispatchTrigger (AND).
  const users = await prisma.user.findMany({
    where: {
      ativo: true,
      role: 'PROPONENTE',
      inscricoes: { none: { editalId } },
    },
    select: { id: true },
  })

  return {
    userIds: users.map((u) => u.id),
    filtroOverride: { semInscricaoNoEdital: editalId },
  }
}
