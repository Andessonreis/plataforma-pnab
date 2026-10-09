import type { z } from 'zod'

type Busca = Record<string, string | string[] | undefined>

/** Lê os filtros da URL com o schema da API; parâmetro inválido cai no padrão. */
export function lerFiltros<S extends z.ZodTypeAny>(schema: S, busca: Busca): z.infer<S> {
  const simples = Object.fromEntries(
    Object.entries(busca).filter((e): e is [string, string] => typeof e[1] === 'string' && e[1] !== ''),
  )
  const lido = schema.safeParse(simples)
  return lido.success ? lido.data : schema.parse({})
}

/** Monta um caminho com parâmetros, ignorando os vazios. Base pode já trazer query. */
export function montarUrl(base: string, params: Record<string, string | number | undefined>) {
  const url = new URL(base, 'http://local')
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v))
  }
  return `${url.pathname}${url.search}`
}
