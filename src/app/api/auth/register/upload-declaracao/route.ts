import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { uploadFile } from '@/lib/storage'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_MIME = 'application/pdf'

export async function POST(req: NextRequest) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const userId = formData.get('userId') as string | null

    // Validação dos campos obrigatórios
    if (!file || !userId) {
      const res = NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Arquivo e userId são obrigatórios.', requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // Validação do tipo do arquivo
    if (file.type !== ALLOWED_MIME) {
      const res = NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Apenas arquivos PDF são aceitos.', requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // Validação do tamanho
    if (file.size > MAX_FILE_SIZE) {
      const res = NextResponse.json(
        { error: 'BAD_REQUEST', message: 'O arquivo deve ter no máximo 10 MB.', requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // Converte o File para Buffer para upload no Supabase
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const storagePath = `declaracoes/${userId}/declaracao.pdf`
    const publicUrl = await uploadFile('propostas', storagePath, buffer, ALLOWED_MIME)

    const res = NextResponse.json(
      { message: 'Declaração enviada com sucesso.', url: publicUrl, requestId },
      { status: 201 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'POST',
      path: '/api/auth/register/upload-declaracao',
      status: 201,
      userId,
      durationMs: Date.now() - start,
    })

    return res
  } catch (err) {
    console.error({
      requestId,
      error: err instanceof Error ? err.message : 'Unknown',
    })

    const res = NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro ao enviar declaração. Tente novamente.', requestId },
      { status: 500 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  }
}
