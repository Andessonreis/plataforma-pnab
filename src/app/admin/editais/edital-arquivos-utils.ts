import type { TipoOption } from './edital-arquivos-types'

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

/** Remove a extensão do nome do arquivo pra sugerir um título padrão. */
export function stripExtension(filename: string): string {
  return filename.replace(/\.[^.]+$/, '')
}

/** Valida tipo MIME e tamanho do arquivo selecionado antes do envio. */
export function validateArquivoFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return 'Tipo de arquivo não permitido. Aceitos: PDF, PNG, JPEG, XLSX.'
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'O arquivo deve ter no máximo 10 MB.'
  }
  return null
}

/** Resolve o label de exibição de um tipo de documento a partir das opções carregadas. */
export function getTipoLabel(tipoOptions: TipoOption[], tipoValue: string): string {
  return tipoOptions.find((t) => t.value === tipoValue)?.label ?? tipoValue
}
