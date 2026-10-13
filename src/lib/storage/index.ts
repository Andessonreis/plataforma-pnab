import { promises as fs } from 'node:fs'
import path from 'node:path'
import { isBucket } from './buckets'
import { assinar } from './assinatura'
import { lerUrl, montarUrl, resolverCaminho } from './paths'

/**
 * Armazenamento em disco na própria VPS (UPLOAD_DIR), organizado por bucket.
 * Mantém a mesma API que o antigo storage em nuvem, então os chamadores não mudam.
 * Os arquivos são servidos por src/app/api/arquivos.
 */

/**
 * Grava o arquivo e retorna a URL (relativa) que serve o conteúdo.
 * Com `upsert=false`, falha se o arquivo já existir.
 * `contentType` é aceito por compatibilidade: o tipo servido sai da extensão.
 */
export async function uploadFile(
  bucket: string,
  caminho: string,
  file: Buffer | Blob,
  _contentType: string,
  upsert = true,
): Promise<string> {
  const destino = resolverCaminho(bucket, caminho)
  const bytes = Buffer.isBuffer(file) ? file : Buffer.from(await file.arrayBuffer())
  try {
    await fs.mkdir(path.dirname(destino), { recursive: true })
    await fs.writeFile(destino, bytes, { flag: upsert ? 'w' : 'wx' })
  } catch (err) {
    throw new Error(`Upload falhou: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
  }
  return montarUrl(bucket, caminho)
}

/** Remove o arquivo. Arquivo já inexistente não é erro (idempotente). */
export async function deleteFile(bucket: string, caminho: string): Promise<void> {
  try {
    await fs.unlink(resolverCaminho(bucket, caminho))
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return
    throw new Error(`Deleção falhou: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
  }
}

/** Lê os bytes direto do disco — para processamento server-side (ex.: mesclar anexos em PDF). */
export async function downloadFile(bucket: string, caminho: string): Promise<Buffer> {
  try {
    return await fs.readFile(resolverCaminho(bucket, caminho))
  } catch (err) {
    throw new Error(`Download falhou: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
  }
}

/**
 * Extrai o caminho dentro do bucket a partir de uma URL gerada por `uploadFile`.
 * Retorna `null` se a URL não for deste storage ou for de outro bucket (ex.: link externo).
 */
export function extractStoragePath(bucket: string, url: string): string | null {
  const lida = lerUrl(url)
  return lida && lida.bucket === bucket ? lida.caminho : null
}

/** Versão de `extractStoragePath` que descobre o bucket pela própria URL. */
export function parseStorageUrl(url: string): { bucket: string; caminho: string } | null {
  return lerUrl(url)
}

/**
 * URL assinada, com validade, para arquivos do bucket privado ('propostas').
 * A assinatura (HMAC) é conferida por src/app/api/arquivos.
 */
export async function getSignedUrl(
  bucket: string,
  caminho: string,
  expiresInSeconds = 3600,
): Promise<string> {
  if (!isBucket(bucket)) throw new Error(`URL assinada falhou: bucket desconhecido ${bucket}`)
  resolverCaminho(bucket, caminho)
  const expiraEm = Math.floor(Date.now() / 1000) + expiresInSeconds
  const assinatura = assinar(bucket, caminho, expiraEm)
  return `${montarUrl(bucket, caminho)}?exp=${expiraEm}&sig=${assinatura}`
}
