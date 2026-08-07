import { prisma } from '@/lib/db'
import { extractFases, migrateLegacyCronograma } from '@/lib/utils/cronograma'
import { parseBrazilDateTime } from '@/lib/utils/format'
import type { TriggerContext, TriggerResult, EditalPrazoEncerrandoConfig } from '../types'

/**
 * Trigger: EDITAL_PRAZO_ENCERRANDO
 *
 * Encontra proponentes com inscrição em RASCUNHO num edital cujas
 * inscrições encerram nas próximas `horas` — pra quem já começou mas não
 * enviou ainda, diferente do rascunho-pendente (que olha inatividade, não
 * o prazo do edital em si).
 */
export async function editalPrazoEncerrandoExecutor(ctx: TriggerContext): Promise<TriggerResult> {
  const config = ctx.ruleConfig as EditalPrazoEncerrandoConfig
  const horas = Math.max(1, Number(config.horas) || 48)

  const now = new Date()
  const limite = new Date(now.getTime() + horas * 60 * 60 * 1000)

  const editais = await prisma.edital.findMany({
    where: {
      status: 'INSCRICOES_ABERTAS',
      ...(config.editalIds && config.editalIds.length > 0 ? { id: { in: config.editalIds } } : {}),
    },
    select: { id: true, cronograma: true },
  })

  const editalIdsComPrazoProximo: string[] = []

  for (const edital of editais) {
    const items = migrateLegacyCronograma(edital.cronograma)
    const fases = extractFases(items)
    const encerramento = fases.INSCRICOES_ENCERRADAS?.dataHora
    if (!encerramento) continue

    const dataEncerramento = parseBrazilDateTime(encerramento)
    if (isNaN(dataEncerramento.getTime())) continue

    if (dataEncerramento > now && dataEncerramento <= limite) {
      editalIdsComPrazoProximo.push(edital.id)
    }
  }

  if (editalIdsComPrazoProximo.length === 0) return { userIds: [] }

  const inscricoes = await prisma.inscricao.findMany({
    where: { editalId: { in: editalIdsComPrazoProximo }, status: 'RASCUNHO' },
    select: { proponenteId: true },
    distinct: ['proponenteId'],
  })

  return { userIds: inscricoes.map((i) => i.proponenteId) }
}
