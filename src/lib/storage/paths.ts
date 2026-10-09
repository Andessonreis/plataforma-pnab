import path from 'node:path'
import { isBucket } from './buckets'

/** Prefixo da rota que serve os arquivos (src/app/api/arquivos). */
export const PREFIXO_URL = '/api/arquivos'

export function uploadRoot(): string {
  return path.resolve(process.env.UPLOAD_DIR ?? './uploads')
}

/**
 * Resolve bucket + caminho para um caminho absoluto dentro de UPLOAD_DIR.
 * Rejeita bucket desconhecido e qualquer tentativa de sair da pasta (`..`, caminho absoluto, NUL).
 */
export function resolverCaminho(bucket: string, caminho: string): string {
  if (!isBucket(bucket)) throw new Error(`Bucket desconhecido: ${bucket}`)
  if (!caminho || caminho.includes('\0') || path.isAbsolute(caminho)) {
    throw new Error('Caminho de arquivo inválido')
  }
  const base = path.join(uploadRoot(), bucket)
  const absoluto = path.resolve(base, caminho)
  if (absoluto !== base && !absoluto.startsWith(base + path.sep)) {
    throw new Error('Caminho de arquivo inválido')
  }
  return absoluto
}

/** URL relativa servida por /api/arquivos, com cada segmento codificado. */
export function montarUrl(bucket: string, caminho: string): string {
  const codificado = caminho.split('/').map(encodeURIComponent).join('/')
  return `${PREFIXO_URL}/${bucket}/${codificado}`
}

/**
 * Lê uma URL gerada por `montarUrl` (com ou sem host e query) e devolve bucket e caminho.
 * Retorna `null` para links externos (ex.: vídeo do YouTube).
 */
export function lerUrl(url: string): { bucket: string; caminho: string } | null {
  const idx = url.indexOf(`${PREFIXO_URL}/`)
  if (idx === -1) return null
  const [semQuery] = url.slice(idx + PREFIXO_URL.length + 1).split('?')
  const [bucket, ...resto] = semQuery.split('/')
  if (!isBucket(bucket) || resto.length === 0) return null
  return { bucket, caminho: resto.map(decodeURIComponent).join('/') }
}
