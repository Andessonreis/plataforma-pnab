import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { uploadFile } from '@/lib/storage'
import { lerImagemValidada } from '@/lib/upload/imagem'

export const runtime = 'nodejs'

const PASTAS_PERMITIDAS = ['noticias', 'slides', 'momentos'] as const
type Pasta = (typeof PASTAS_PERMITIDAS)[number]

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
    if (!session || !['ADMIN', 'SUPER_ADMIN', 'COMUNICACAO'].includes(session.user.role)) {
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

    const imagem = await lerImagemValidada(file)
    if (!imagem.ok) {
      return buildResponse(400, { error: 'BAD_REQUEST', message: imagem.message })
    }

    const fileId = randomUUID()
    const storagePath = `${pastaRaw}/${fileId}.${imagem.ext}`

    const publicUrl = await uploadFile('editais', storagePath, imagem.buffer, file.type)

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
