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

// Etapa opcional de inscrição por vídeo (só liberada quando edital.videoHabilitado)
export const VIDEO_ANEXO_TIPOS = {
  substitutivo: 'VIDEO_SUBSTITUTIVO',
  complementar: 'VIDEO_COMPLEMENTAR',
} as const

export const MAX_VIDEO_SIZE_MB = 150
export const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024

export const ALLOWED_VIDEO_MIMES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
] as const

export const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov'] as const

export const VIDEO_MIME_LABEL = 'MP4, WebM ou MOV'

export type ValidationError =
  | { kind: 'size'; filename: string; sizeMb: number }
  | { kind: 'mime'; filename: string; mime: string }
  | { kind: 'extension'; filename: string; ext: string }

interface FileTypeConfig {
  maxSizeBytes: number
  maxSizeMb: number
  allowedMimes: readonly string[]
  allowedExtensions: readonly string[]
}

/**
 * Valida um arquivo contra um conjunto de tamanho/MIME/extensão permitidos.
 * Retorna null se OK, ou um erro estruturado pra a UI montar a mensagem.
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
function validateFileAgainstConfig(file: File, config: FileTypeConfig): ValidationError | null {
  if (file.size > config.maxSizeBytes) {
    return {
      kind: 'size',
      filename: file.name,
      sizeMb: file.size / (1024 * 1024),
    }
  }

  const ext = '.' + (file.name.split('.').pop()?.toLowerCase() ?? '')
  const extOk = config.allowedExtensions.includes(ext)
  const mimeOk = config.allowedMimes.includes(file.type)

  if (extOk || mimeOk) return null

  // Nada bate. Reporta a extensão (mais visível pro usuário) ou o MIME se
  // não houver extensão informada.
  if (ext && ext !== '.') {
    return { kind: 'extension', filename: file.name, ext }
  }
  return { kind: 'mime', filename: file.name, mime: file.type || '(desconhecido)' }
}

export function validateAnexoFile(file: File): ValidationError | null {
  return validateFileAgainstConfig(file, {
    maxSizeBytes: MAX_FILE_SIZE_BYTES,
    maxSizeMb: MAX_FILE_SIZE_MB,
    allowedMimes: ALLOWED_MIMES,
    allowedExtensions: ALLOWED_EXTENSIONS,
  })
}

export function validateVideoFile(file: File): ValidationError | null {
  return validateFileAgainstConfig(file, {
    maxSizeBytes: MAX_VIDEO_SIZE_BYTES,
    maxSizeMb: MAX_VIDEO_SIZE_MB,
    allowedMimes: ALLOWED_VIDEO_MIMES,
    allowedExtensions: ALLOWED_VIDEO_EXTENSIONS,
  })
}

function describeValidationErrorWithLabel(err: ValidationError, maxSizeMb: number, mimeLabel: string): string {
  switch (err.kind) {
    case 'size':
      return `${err.filename} excede o limite de ${maxSizeMb}MB (${err.sizeMb.toFixed(1)}MB). Reduza o tamanho ou divida em partes.`
    case 'mime':
      return `${err.filename} tem formato não permitido (${err.mime}). Aceitos: ${mimeLabel}.`
    case 'extension':
      return `${err.filename} tem extensão não permitida (${err.ext}). Aceitos: ${mimeLabel}.`
  }
}

export function describeValidationError(err: ValidationError): string {
  return describeValidationErrorWithLabel(err, MAX_FILE_SIZE_MB, MIME_LABEL)
}

export function describeVideoValidationError(err: ValidationError): string {
  return describeValidationErrorWithLabel(err, MAX_VIDEO_SIZE_MB, VIDEO_MIME_LABEL)
}
