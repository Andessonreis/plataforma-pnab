import { randomUUID } from 'crypto'
import { uploadFile } from '@server/lib/storage'
import { validateMagicBytes } from '@shared/upload/validate'
import { UploadInvalidoError } from '../errors/upload.errors'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const
type AllowedMime = (typeof ALLOWED_MIME)[number]

const MIME_TO_EXT: Record<AllowedMime, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

const PASTAS_PERMITIDAS = ['noticias', 'slides'] as const
type Pasta = (typeof PASTAS_PERMITIDAS)[number]

function isAllowedMime(mime: string): mime is AllowedMime {
  return (ALLOWED_MIME as readonly string[]).includes(mime)
}

function isPastaPermitida(p: string): p is Pasta {
  return (PASTAS_PERMITIDAS as readonly string[]).includes(p)
}

export async function uploadImagem(file: File, pastaRaw: string) {
  if (!isPastaPermitida(pastaRaw)) {
    throw new UploadInvalidoError(`Pasta inválida. Aceitas: ${PASTAS_PERMITIDAS.join(', ')}.`)
  }
  if (!isAllowedMime(file.type)) {
    throw new UploadInvalidoError('Tipo de imagem não permitido. Aceitos: JPG, PNG, WEBP.')
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new UploadInvalidoError('A imagem deve ter no máximo 5 MB.')
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  if (!validateMagicBytes(buffer, file.type)) {
    throw new UploadInvalidoError('O conteúdo da imagem não corresponde ao tipo declarado.')
  }

  const ext = MIME_TO_EXT[file.type]
  const fileId = randomUUID()
  const storagePath = `${pastaRaw}/${fileId}.${ext}`

  const url = await uploadFile('editais', storagePath, buffer, file.type)
  return { url }
}
