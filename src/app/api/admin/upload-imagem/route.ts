import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { auth } from '@server/lib/auth'
import { uploadFile } from '@/lib/storage'
import { validateMagicBytes } from '@shared/upload/validate'

export const runtime = 'nodejs'

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

export async function POST(req: NextRequest) {
  const requestId = randomUUID()
  const start = Date.now()

  const buildResponse = (status: number, body: Record<string, unknown>) => {
    const res = NextResponse.json({ ...body, requestId }, { status })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  }

  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return buildResponse(401, { error: 'UNAUTHORIZED', message: 'Acesso negado.' })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const pastaRaw = (formData.get('pasta') as string | null) ?? 'noticias'

    if (!file) {
      return buildResponse(400, { error: 'BAD_REQUEST', message: 'Campo "file" é obrigatório.' })
    }

    if (!isPastaPermitida(pastaRaw)) {
      return buildResponse(400, {
        error: 'BAD_REQUEST',
        message: `Pasta inválida. Aceitas: ${PASTAS_PERMITIDAS.join(', ')}.`,
      })
    }

    if (!isAllowedMime(file.type)) {
      return buildResponse(400, {
        error: 'BAD_REQUEST',
        message: 'Tipo de imagem não permitido. Aceitos: JPG, PNG, WEBP.',
      })
    }

    if (file.size > MAX_FILE_SIZE) {
      return buildResponse(400, {
        error: 'BAD_REQUEST',
        message: 'A imagem deve ter no máximo 5 MB.',
      })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    if (!validateMagicBytes(buffer, file.type)) {
      return buildResponse(400, {
        error: 'BAD_REQUEST',
        message: 'O conteúdo da imagem não corresponde ao tipo declarado.',
      })
    }

    const ext = MIME_TO_EXT[file.type]
    const fileId = randomUUID()
    const storagePath = `${pastaRaw}/${fileId}.${ext}`

    const publicUrl = await uploadFile('editais', storagePath, buffer, file.type)

    const res = NextResponse.json({ url: publicUrl, requestId }, { status: 201 })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'POST',
      path: '/api/admin/upload-imagem',
      status: 201,
      durationMs: Date.now() - start,
      pasta: pastaRaw,
      mime: file.type,
      bytes: file.size,
    })
    return res
  } catch (err) {
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    return buildResponse(500, { error: 'INTERNAL_ERROR', message: 'Erro ao fazer upload da imagem.' })
  }
}
