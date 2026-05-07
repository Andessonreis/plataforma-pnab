/**
 * Configuração compartilhada para upload de anexos de inscrição.
 *
 * Usada tanto no client (validação imediata antes do upload, #78) quanto
 * no server (defesa em profundidade). Manter as duas pontas no mesmo
 * lugar evita inconsistência entre o que a UI aceita e o que o backend
 * rejeita.
 */

export const MAX_FILE_SIZE_MB = 10
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

export const ALLOWED_MIMES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
] as const

export const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg'] as const

export const MIME_LABEL = 'PDF, PNG ou JPEG'

export type ValidationError =
  | { kind: 'size'; filename: string; sizeMb: number }
  | { kind: 'mime'; filename: string; mime: string }
  | { kind: 'extension'; filename: string; ext: string }

/**
 * Valida um arquivo antes do upload. Retorna null se OK, ou um erro
 * estruturado pra a UI montar a mensagem.
 *
 * Ordem da checagem:
 *  1. Tamanho — limite estrito.
 *  2. Extensão — se a extensão está na whitelist, aceita
 *     (browsers/SOs às vezes preenchem MIME errado pra arquivos válidos).
 *  3. MIME — se a extensão não passou, dá uma chance pelo MIME.
 *
 * O backend faz validação estrita por magic bytes (defesa em profundidade),
 * então ser um pouco permissivo no client é OK.
 */
export function validateAnexoFile(file: File): ValidationError | null {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      kind: 'size',
      filename: file.name,
      sizeMb: file.size / (1024 * 1024),
    }
  }

  const ext = '.' + (file.name.split('.').pop()?.toLowerCase() ?? '')
  const extOk = ALLOWED_EXTENSIONS.includes(ext as typeof ALLOWED_EXTENSIONS[number])
  const mimeOk = ALLOWED_MIMES.includes(file.type as typeof ALLOWED_MIMES[number])

  if (extOk || mimeOk) return null

  // Nada bate. Reporta a extensão (mais visível pro usuário) ou o MIME se
  // não houver extensão informada.
  if (ext && ext !== '.') {
    return { kind: 'extension', filename: file.name, ext }
  }
  return { kind: 'mime', filename: file.name, mime: file.type || '(desconhecido)' }
}

export function describeValidationError(err: ValidationError): string {
  switch (err.kind) {
    case 'size':
      return `${err.filename} excede o limite de ${MAX_FILE_SIZE_MB}MB (${err.sizeMb.toFixed(1)}MB). Reduza o tamanho ou divida em partes.`
    case 'mime':
      return `${err.filename} tem formato não permitido (${err.mime}). Aceitos: ${MIME_LABEL}.`
    case 'extension':
      return `${err.filename} tem extensão não permitida (${err.ext}). Aceitos: ${MIME_LABEL}.`
  }
}
