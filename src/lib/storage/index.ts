import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

// Client com service role — inicializado sob demanda para não quebrar o build
function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios')
    }
    _supabase = createClient(supabaseUrl, supabaseServiceKey)
  }
  return _supabase
}

// Mantém export para compatibilidade, mas agora é lazy
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

/**
 * Faz upload de um arquivo e retorna a URL pública.
 * @param bucket  Nome do bucket no Supabase (ex: 'editais', 'propostas')
 * @param path    Caminho dentro do bucket (ex: 'edital-123/edital.pdf')
 * @param file    Buffer ou Blob do arquivo
 * @param contentType  MIME type (ex: 'application/pdf')
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: Buffer | Blob,
  contentType: string,
  upsert = true,
): Promise<string> {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType, upsert })

  if (error) throw new Error(`Upload falhou: ${error.message}`)

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Remove um arquivo do bucket.
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) throw new Error(`Deleção falhou: ${error.message}`)
}

/**
 * Baixa os bytes de um arquivo diretamente (service role — ignora privacidade do bucket).
 * Preferível a `getSignedUrl` + fetch quando o processamento é 100% server-side
 * (ex.: mesclar anexos em um PDF), pois evita o round-trip HTTP extra.
 */
export async function downloadFile(bucket: string, path: string): Promise<Buffer> {
  const { data, error } = await supabase.storage.from(bucket).download(path)
  if (error || !data) throw new Error(`Download falhou: ${error?.message}`)
  return Buffer.from(await data.arrayBuffer())
}

/**
 * Extrai o path dentro do bucket a partir de uma URL pública gerada por `uploadFile`
 * (formato `.../storage/v1/object/public/<bucket>/<path>`).
 * Retorna `null` se a URL não seguir esse formato (ex.: link externo de vídeo).
 */
export function extractStoragePath(bucket: string, url: string): string | null {
  const marker = `/object/public/${bucket}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return decodeURIComponent(url.slice(idx + marker.length))
}

/**
 * Gera uma URL assinada para acesso temporário a arquivos privados.
 * Usar para o bucket 'propostas' (anexos sensíveis).
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds)

  if (error || !data) throw new Error(`URL assinada falhou: ${error?.message}`)
  return data.signedUrl
}

// ─── Buckets esperados no Supabase ───────────────────────────────────────────
// editais   → PDFs e anexos dos editais          (público)
// propostas → Anexos enviados pelos proponentes  (privado, signed URL)
// manuais   → Manuais e materiais institucionais (público)
