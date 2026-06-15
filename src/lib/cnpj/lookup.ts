import { redis } from '@server/lib/redis'
import { fetchFromBrasilApi, fetchFromReceitaWs, CnpjProviderError } from './providers'
import type { CnpjLookupResult } from './types'

const CACHE_PREFIX = 'cnpj:'
const TTL_HIT_SECONDS = 60 * 60 * 24 * 7   // 7 dias
const TTL_MISS_SECONDS = 60 * 60            // 1 hora (negative cache)
const SENTINEL_NOT_FOUND = '__NOT_FOUND__'

export type LookupOutcome =
  | { ok: true; data: CnpjLookupResult; cached: boolean }
  | { ok: false; reason: 'NOT_FOUND' | 'UPSTREAM_ERROR' }

export async function lookupCnpj(cnpj: string): Promise<LookupOutcome> {
  const key = `${CACHE_PREFIX}${cnpj}`

  // 1. Cache
  try {
    const cached = await redis.get(key)
    if (cached === SENTINEL_NOT_FOUND) {
      return { ok: false, reason: 'NOT_FOUND' }
    }
    if (cached) {
      return { ok: true, data: JSON.parse(cached) as CnpjLookupResult, cached: true }
    }
  } catch (err) {
    // Fail-open: se Redis cair, só loga e segue direto para upstream.
    console.error('[cnpj-lookup] Redis get falhou:', err instanceof Error ? err.message : 'Unknown')
  }

  // 2. BrasilAPI (primário)
  let result: CnpjLookupResult | null = null
  let brasilApiFailed = false

  try {
    result = await fetchFromBrasilApi(cnpj)
  } catch (err) {
    brasilApiFailed = true
    if (err instanceof CnpjProviderError) {
      console.warn('[cnpj-lookup] BrasilAPI falhou:', err.message)
    } else {
      console.warn('[cnpj-lookup] BrasilAPI erro desconhecido:', err)
    }
  }

  // 3. ReceitaWS (fallback apenas se BrasilAPI falhou por rede/5xx)
  if (brasilApiFailed) {
    try {
      result = await fetchFromReceitaWs(cnpj)
    } catch (err) {
      if (err instanceof CnpjProviderError) {
        console.warn('[cnpj-lookup] ReceitaWS falhou:', err.message)
      } else {
        console.warn('[cnpj-lookup] ReceitaWS erro desconhecido:', err)
      }
      return { ok: false, reason: 'UPSTREAM_ERROR' }
    }
  }

  // 4. 404 (CNPJ não existe)
  if (result === null) {
    try {
      await redis.setex(key, TTL_MISS_SECONDS, SENTINEL_NOT_FOUND)
    } catch {
      // ignora falha de cache negativo
    }
    return { ok: false, reason: 'NOT_FOUND' }
  }

  // 5. Sucesso → cache 7 dias
  try {
    await redis.setex(key, TTL_HIT_SECONDS, JSON.stringify(result))
  } catch (err) {
    console.error('[cnpj-lookup] Redis setex falhou:', err instanceof Error ? err.message : 'Unknown')
  }

  return { ok: true, data: result, cached: false }
}
