import { randomUUID } from 'crypto'
import { z } from 'zod'
import { badRequest, created } from '@/lib/api/response'
import { MAX_BYTES_MEMORIAL, PASTAS_UPLOAD_MEMORIAL } from '@/lib/memorial/midia'
import { editorial } from '@/lib/memorial/rotas'
import { uploadFile } from '@/lib/storage'
import { lerImagemValidada } from '@/lib/upload/imagem'

export const runtime = 'nodejs'

const pastaSchema = z.enum(PASTAS_UPLOAD_MEMORIAL).default('acervo')

/**
 * Recebe uma imagem (campo `file`) e grava no bucket público `memorial`.
 * O nome no disco é gerado aqui; o nome enviado pelo navegador é ignorado.
 */
export const POST = editorial('POST', '/api/v1/memorial/upload', async (req, ctx) => {
  const form = await req.formData()
  const file = form.get('file')
  if (!(file instanceof File)) return badRequest(ctx, 'Campo "file" é obrigatório.')

  const pasta = pastaSchema.safeParse(form.get('pasta') ?? undefined)
  if (!pasta.success) return badRequest(ctx, `Pasta inválida. Aceitas: ${PASTAS_UPLOAD_MEMORIAL.join(', ')}.`)

  const imagem = await lerImagemValidada(file, MAX_BYTES_MEMORIAL)
  if (!imagem.ok) return badRequest(ctx, imagem.message)

  const url = await uploadFile('memorial', `${pasta.data}/${randomUUID()}.${imagem.ext}`, imagem.buffer, file.type)
  return created(ctx, { url })
})
