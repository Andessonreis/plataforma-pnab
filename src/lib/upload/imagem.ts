import { validateMagicBytes } from './validate'

/**
 * Regras de upload de imagem compartilhadas pelos formulários (checagem rápida no
 * navegador) e pelas rotas de upload (checagem definitiva, com assinatura de bytes).
 */

export const IMAGEM_MIMES = ['image/jpeg', 'image/png', 'image/webp'] as const
export type ImagemMime = (typeof IMAGEM_MIMES)[number]

export const IMAGEM_EXTENSAO: Record<ImagemMime, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export const IMAGEM_MAX_BYTES = 5 * 1024 * 1024

export function isImagemMime(mime: string): mime is ImagemMime {
  return (IMAGEM_MIMES as readonly string[]).includes(mime)
}

export function megabytes(bytes: number): string {
  return String(Math.round(bytes / 1024 / 1024))
}

type ImagemLida = { ok: true; buffer: Buffer; ext: string } | { ok: false; message: string }

/** Confere tipo declarado, tamanho e assinatura de bytes antes de gravar. */
export async function lerImagemValidada(file: File, maxBytes = IMAGEM_MAX_BYTES): Promise<ImagemLida> {
  if (!isImagemMime(file.type)) {
    return { ok: false, message: 'Tipo de imagem não permitido. Aceitos: JPG, PNG, WEBP.' }
  }
  if (file.size > maxBytes) {
    return { ok: false, message: `A imagem deve ter no máximo ${megabytes(maxBytes)} MB.` }
  }
  const buffer = Buffer.from(await file.arrayBuffer())
  if (!validateMagicBytes(buffer, file.type)) {
    return { ok: false, message: 'O conteúdo da imagem não corresponde ao tipo declarado.' }
  }
  return { ok: true, buffer, ext: IMAGEM_EXTENSAO[file.type] }
}
