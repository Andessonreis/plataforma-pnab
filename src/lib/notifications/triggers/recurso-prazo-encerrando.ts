import { prisma } from '@/lib/db'
import { janelaParaAcao } from '@/lib/utils/cronograma-janela'
import type { InscricaoStatus } from '@prisma/client'
import type { TriggerContext, TriggerResult, RecursoPrazoEncerrandoConfig } from '../types'

/**
 * Uma janela de recurso corresponde a um status específico de inscrição —
 * é esse status que autoriza `submitRecurso` (ver STATUS_ALLOWS_RECURSO em
 * recurso.service.ts). Só cobre as 2 janelas com ação dedicada no
 * cronograma; a janela de resultado final usa a fase RECURSO diretamente
 * e fica fora daqui por ora.
 */
const JANELAS_RECURSO: { acao: 'RECURSO_HABILITACAO_JANELA' | 'RECURSO_RESULTADO_JANELA'; status: InscricaoStatus; fase: string }[] = [
  { acao: 'RECURSO_HABILITACAO_JANELA', status: 'INABILITADA', fase: 'HABILITACAO' },
  { acao: 'RECURSO_RESULTADO_JANELA', status: 'RESULTADO_PRELIMINAR', fase: 'RESULTADO_PRELIMINAR' },
]

/**
 * Trigger: RECURSO_PRAZO_ENCERRANDO
 *
 * Encontra proponentes cuja inscrição está num status que permite recurso
 * (INABILITADA ou RESULTADO_PRELIMINAR), a janela de recurso correspondente
 * fecha nas próximas `horas`, e eles ainda não registraram um Recurso para
 * essa fase.
 */
export async function recursoPrazoEncerrandoExecutor(ctx: TriggerContext): Promise<TriggerResult> {
  const config = ctx.ruleConfig as RecursoPrazoEncerrandoConfig
  const horas = Math.max(1, Number(config.horas) || 24)

  const now = new Date()
  const limite = new Date(now.getTime() + horas * 60 * 60 * 1000)

  const editais = await prisma.edital.findMany({
    where: config.editalIds && config.editalIds.length > 0 ? { id: { in: config.editalIds } } : {},
    select: { id: true, cronograma: true },
  })

  const userIds = new Set<string>()

  for (const edital of editais) {
    for (const janela of JANELAS_RECURSO) {
      const info = janelaParaAcao(edital.cronograma, janela.acao, now)
      if (!info?.ativa || !info.fim) continue
      if (info.fim <= now || info.fim > limite) continue

      const inscricoes = await prisma.inscricao.findMany({
        where: {
          editalId: edital.id,
          status: janela.status,
          recursos: { none: { fase: janela.fase } },
        },
        select: { proponenteId: true },
      })

      inscricoes.forEach((i) => userIds.add(i.proponenteId))
    }
  }

  return { userIds: [...userIds] }
}
