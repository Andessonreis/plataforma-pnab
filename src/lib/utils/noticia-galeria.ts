import { TZ_BR } from './format'

export interface GaleriaItem {
  url: string
  legenda: string
  /** Data no formato `YYYY-MM-DD`. Opcional — item sem data não recebe status. */
  data: string | null
}

export type StatusDia = 'hoje' | 'passado' | 'futuro' | null

/**
 * Só aceita o formato `{ url, legenda, data }[]`; qualquer outra forma no
 * JSON livre é ignorada — mesmo critério defensivo de `extrairRelatorios`
 * em `projetos-apoiados/consulta.ts`.
 */
export function parseGaleria(json: unknown): GaleriaItem[] {
  if (!Array.isArray(json)) return []
  return json.filter((item): item is GaleriaItem => {
    if (typeof item !== 'object' || item === null) return false
    const registro = item as Record<string, unknown>
    return (
      typeof registro.url === 'string' &&
      typeof registro.legenda === 'string' &&
      (registro.data === null || typeof registro.data === 'string')
    )
  })
}

/**
 * Compara a data do item (`YYYY-MM-DD`) com hoje, sempre no fuso de Irecê
 * (`TZ_BR`) — nunca no fuso do processo Node. Em produção o container roda
 * em UTC: sem fixar o fuso aqui, o servidor já vira o dia ~21h no horário
 * local, e um card de "hoje" à noite passa a ler como "passado".
 */
export function statusDia(data: string | null, hoje: Date = new Date()): StatusDia {
  if (!data) return null
  const hojeIso = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ_BR }).format(hoje) // YYYY-MM-DD
  if (data === hojeIso) return 'hoje'
  return data < hojeIso ? 'passado' : 'futuro'
}
