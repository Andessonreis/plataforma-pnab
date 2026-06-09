/**
 * Validação de uploads por assinatura de bytes (magic bytes).
 * Previne envio de arquivos maliciosos com extensão falsificada.
 */

// Assinaturas de bytes conhecidas
const MAGIC_BYTES: Record<string, { signature: number[]; offset?: number }[]> = {
  'application/pdf': [
    { signature: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  ],
  'image/png': [
    { signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }, // PNG header
  ],
  'image/jpeg': [
    { signature: [0xff, 0xd8, 0xff] }, // JPEG SOI + marker
  ],
  'image/webp': [
    // RIFF....WEBP — bytes 0–3 = "RIFF", bytes 8–11 = "WEBP" (ignoramos tamanho intermediário)
    { signature: [0x52, 0x49, 0x46, 0x46] },
  ],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
    { signature: [0x50, 0x4b, 0x03, 0x04] }, // PK (ZIP header — XLSX é ZIP)
  ],
  'application/vnd.ms-excel': [
    { signature: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] }, // OLE2 (XLS legado)
  ],
}

/**
 * Valida se o conteúdo do arquivo corresponde ao MIME type declarado.
 * Retorna true se válido, false se a assinatura não bate.
 */
export function validateMagicBytes(buffer: Buffer, declaredMime: string): boolean {
  const signatures = MAGIC_BYTES[declaredMime]
  if (!signatures) {
    // MIME não mapeado — rejeita por precaução
    return false
  }

  return signatures.some(({ signature, offset = 0 }) => {
    if (buffer.length < offset + signature.length) return false
    return signature.every((byte, i) => buffer[offset + i] === byte)
  })
}

/**
 * Sanitiza o nome do arquivo para prevenir path traversal e caracteres perigosos,
 * e converte para o conjunto ASCII seguro aceito pelo Supabase Storage como key.
 *
 * Regras aplicadas:
 * - Remove path separators e traversal (.., /, \)
 * - Remove caracteres de controle e perigosos
 * - Decompõe acentos (NFD) e remove os diacríticos: "Associação" → "Associacao"
 * - Substitui qualquer caractere fora de [a-zA-Z0-9._-] por _ (parênteses, vírgulas, etc)
 * - Colapsa múltiplos _ e remove _ nas bordas
 * - Limita a 200 caracteres
 */
export function sanitizeFilename(filename: string): string {
  const sanitized = filename
    // Remove path separators e traversal
    .replace(/[/\\]/g, '')
    .replace(/\.\./g, '')
    // Remove caracteres de controle
    .replace(/[<>:"|?*\x00-\x1f]/g, '')
    // Decompõe acentos e remove os diacríticos (Á → A + ́ → A)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    // Substitui qualquer não-ASCII-seguro por _
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    // Colapsa _ repetidos
    .replace(/_+/g, '_')
    // Remove _ nas bordas e ponto inicial
    .replace(/^[._]+/, '')
    .replace(/_+$/, '')
    // Limita tamanho
    .slice(0, 200)

  return sanitized || 'arquivo'
}
