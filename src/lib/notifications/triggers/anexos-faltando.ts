import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import type { TriggerContext, TriggerResult, AnexosFaltandoConfig } from '../types'

interface TipoAnexoConfig {
  tipo: string
  obrigatorio: boolean
}

/**
 * Trigger: INSCRICAO_ANEXOS_FALTANDO
 *
 * Encontra proponentes com inscrição ENVIADA cujo edital exige tipos de
 * anexo obrigatórios que ainda não foram todos enviados. Diferente do
 * rascunho pendente — aqui a inscrição já foi submetida, só falta
 * documentação.
 */
export async function anexosFaltandoExecutor(ctx: TriggerContext): Promise<TriggerResult> {
  const config = ctx.ruleConfig as AnexosFaltandoConfig

  const editais = await prisma.edital.findMany({
    where: {
      tiposAnexo: { not: Prisma.JsonNull },
      ...(config.editalIds && config.editalIds.length > 0 ? { id: { in: config.editalIds } } : {}),
    },
    select: { id: true, tiposAnexo: true },
  })

  const userIds = new Set<string>()

  for (const edital of editais) {
    const tiposConfig = (Array.isArray(edital.tiposAnexo) ? edital.tiposAnexo : []) as unknown as TipoAnexoConfig[]
    const tiposObrigatorios = tiposConfig.filter((t) => t?.obrigatorio).map((t) => t.tipo)

    if (tiposObrigatorios.length === 0) continue

    const inscricoes = await prisma.inscricao.findMany({
      where: { editalId: edital.id, status: 'ENVIADA' },
      select: { proponenteId: true, anexos: { select: { tipo: true } } },
    })

    for (const inscricao of inscricoes) {
      const tiposEnviados = new Set(inscricao.anexos.map((a) => a.tipo))
      const faltando = tiposObrigatorios.some((t) => !tiposEnviados.has(t))
      if (faltando) userIds.add(inscricao.proponenteId)
    }
  }

  return { userIds: [...userIds] }
}
