export interface GrupoAno<T> {
  /** `null` reúne os eventos ainda sem ano, que não entram na linha do tempo do site. */
  ano: number | null
  eventos: T[]
}

/**
 * Agrupa eventos por ano, do mais antigo para o mais recente, mantendo a ordem
 * de chegada dentro de cada ano. Os sem ano vão para o fim, num grupo à parte.
 */
export function agruparPorAno<T extends { ano: number | null }>(eventos: T[]): GrupoAno<T>[] {
  const grupos = new Map<number | null, T[]>()
  for (const e of eventos) {
    const lista = grupos.get(e.ano) ?? []
    lista.push(e)
    grupos.set(e.ano, lista)
  }
  return [...grupos.entries()]
    .sort(([a], [b]) => (a === null ? 1 : b === null ? -1 : a - b))
    .map(([ano, lista]) => ({ ano, eventos: lista }))
}
