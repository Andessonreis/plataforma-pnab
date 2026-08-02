import { useEffect, useState } from 'react'

interface UseFetchListResult<T> {
  data: T[]
  loading: boolean
}

/**
 * Busca uma lista em `GET url` (resposta `{ data: T[] }`) e mantém loading/erro-silencioso.
 * `mapFn` transforma o payload cru antes de guardar no estado (ex.: normalizar tipos do Prisma).
 */
export function useFetchList<T>(url: string, mapFn?: (raw: unknown) => T[]): UseFetchListResult<T> {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    fetch(url)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((json) => {
        if (cancelled) return
        setData(mapFn ? mapFn(json.data) : (json.data as T[]))
      })
      .catch(() => {
        // silencioso — lista fica vazia
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  return { data, loading }
}
