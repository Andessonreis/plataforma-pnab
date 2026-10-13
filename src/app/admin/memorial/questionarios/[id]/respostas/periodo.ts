import { z } from 'zod'

const DIA = /^\d{4}-\d{2}-\d{2}$/
const FUSO = '-03:00'

export const periodoSchema = z.object({
  de: z.string().regex(DIA).optional().catch(undefined),
  ate: z.string().regex(DIA).optional().catch(undefined),
})

export type Periodo = z.infer<typeof periodoSchema>

/**
 * Converte os dias escolhidos (horário de Irecê) no intervalo da consulta.
 * "Até" inclui o dia inteiro; se as datas vierem invertidas, são postas na ordem.
 */
export function intervaloDoPeriodo({ de, ate }: Periodo): { gte?: Date; lt?: Date } {
  const [inicio, fim] = de && ate && de > ate ? [ate, de] : [de, ate]
  const intervalo: { gte?: Date; lt?: Date } = {}
  if (inicio) intervalo.gte = new Date(`${inicio}T00:00:00${FUSO}`)
  if (fim) intervalo.lt = new Date(new Date(`${fim}T00:00:00${FUSO}`).getTime() + 24 * 60 * 60 * 1000)
  return intervalo
}

/** Dia (AAAA-MM-DD) de `dias` atrás, no fuso de Irecê; usado pelos atalhos de período. */
export function diaAtras(dias: number, agora = new Date()): string {
  const local = new Date(agora.getTime() - 3 * 60 * 60 * 1000 - dias * 24 * 60 * 60 * 1000)
  return local.toISOString().slice(0, 10)
}
