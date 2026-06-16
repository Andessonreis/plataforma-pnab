import { uploadFile } from '@server/lib/storage'
import { validateMagicBytes } from '@shared/upload/validate'
import { BadRequestError } from '@server/lib/http/errors'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_MIME = 'application/pdf'

export async function uploadDeclaracao(file: File, userId: string) {
  if (file.type !== ALLOWED_MIME) {
    throw new BadRequestError('Apenas arquivos PDF são aceitos.')
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new BadRequestError('O arquivo deve ter no máximo 10 MB.')
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  if (!validateMagicBytes(buffer, ALLOWED_MIME)) {
    throw new BadRequestError('O conteúdo do arquivo não corresponde a um PDF válido.')
  }

  const storagePath = `declaracoes/${userId}/declaracao.pdf`
  const url = await uploadFile('propostas', storagePath, buffer, ALLOWED_MIME)
  return { url }
}
