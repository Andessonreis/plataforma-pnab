import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client com service role — usar apenas no servidor, nunca expor ao browser
export const supabase = createClient(supabaseUrl, supabaseServiceKey)

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
): Promise<string> {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType, upsert: false })

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
