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

/** Compara a data do item (`YYYY-MM-DD`) com hoje, no fuso local do servidor. */
export function statusDia(data: string | null, hoje: Date = new Date()): StatusDia {
  if (!data) return null
  const hojeIso = hoje.toLocaleDateString('sv-SE') // YYYY-MM-DD, sem depender de timezone lib
  if (data === hojeIso) return 'hoje'
  return data < hojeIso ? 'passado' : 'futuro'
}
