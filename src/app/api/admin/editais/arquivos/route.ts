import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { uploadFile, deleteFile } from '@/lib/storage'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_MIME = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

const MIME_TO_EXT: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
}

// GET — listar arquivos de um edital
export async function GET(req: NextRequest) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      const res = NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Acesso negado.', requestId },
        { status: 401 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const editalId = req.nextUrl.searchParams.get('editalId')
    if (!editalId) {
      const res = NextResponse.json(
        { error: 'BAD_REQUEST', message: 'editalId é obrigatório.', requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const arquivos = await prisma.arquivoEdital.findMany({
      where: { editalId },
      orderBy: { createdAt: 'desc' },
    })

    const res = NextResponse.json({ data: arquivos })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    console.log({ requestId, method: 'GET', path: '/api/admin/editais/arquivos', status: 200, durationMs: Date.now() - start })
    return res
  } catch (err) {
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    const res = NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro ao listar arquivos.', requestId },
      { status: 500 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  }
}

// POST — upload de arquivo
export async function POST(req: NextRequest) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      const res = NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Acesso negado.', requestId },
        { status: 401 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const editalId = formData.get('editalId') as string | null
    const tipo = formData.get('tipo') as string | null
    const titulo = formData.get('titulo') as string | null

    if (!file || !editalId || !tipo || !titulo) {
      const res = NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Campos obrigatórios: file, editalId, tipo, titulo.', requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    if (!ALLOWED_MIME.includes(file.type)) {
      const res = NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Tipo de arquivo não permitido. Aceitos: PDF, PNG, JPEG, XLSX.', requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    if (file.size > MAX_FILE_SIZE) {
      const res = NextResponse.json(
        { error: 'BAD_REQUEST', message: 'O arquivo deve ter no máximo 10 MB.', requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // Verifica se o edital existe
    const edital = await prisma.edital.findUnique({ where: { id: editalId }, select: { id: true } })
    if (!edital) {
      const res = NextResponse.json(
        { error: 'NOT_FOUND', message: 'Edital não encontrado.', requestId },
        { status: 404 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const ext = MIME_TO_EXT[file.type] ?? 'bin'
    const fileId = randomUUID().split('-')[0]
    const storagePath = `edital-${editalId}/${fileId}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const publicUrl = await uploadFile('editais', storagePath, buffer, file.type)

    const arquivo = await prisma.arquivoEdital.create({
      data: {
        editalId,
        tipo,
        titulo,
        url: publicUrl,
      },
    })

    const res = NextResponse.json(
      { id: arquivo.id, titulo: arquivo.titulo, tipo: arquivo.tipo, url: arquivo.url },
      { status: 201 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    console.log({ requestId, method: 'POST', path: '/api/admin/editais/arquivos', status: 201, durationMs: Date.now() - start })
    return res
  } catch (err) {
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    const res = NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro ao fazer upload.', requestId },
      { status: 500 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  }
}

// DELETE — remover arquivo
export async function DELETE(req: NextRequest) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      const res = NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Acesso negado.', requestId },
        { status: 401 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const id = req.nextUrl.searchParams.get('id')
    if (!id) {
      const res = NextResponse.json(
        { error: 'BAD_REQUEST', message: 'id é obrigatório.', requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const arquivo = await prisma.arquivoEdital.findUnique({ where: { id } })
    if (!arquivo) {
      const res = NextResponse.json(
        { error: 'NOT_FOUND', message: 'Arquivo não encontrado.', requestId },
        { status: 404 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // Extrai o path relativo da URL do Supabase
    // URL: https://xxx.supabase.co/storage/v1/object/public/editais/edital-xxx/file.pdf
    const urlObj = new URL(arquivo.url)
    const pathParts = urlObj.pathname.split('/storage/v1/object/public/editais/')
    if (pathParts.length === 2) {
      try {
        await deleteFile('editais', pathParts[1])
      } catch {
        // Se falhar ao deletar do storage, continua e remove do banco
        console.error({ requestId, warning: 'Falha ao deletar arquivo do storage' })
      }
    }

    await prisma.arquivoEdital.delete({ where: { id } })

    const res = NextResponse.json({ message: 'ok' })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    console.log({ requestId, method: 'DELETE', path: '/api/admin/editais/arquivos', status: 200, durationMs: Date.now() - start })
    return res
  } catch (err) {
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    const res = NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro ao remover arquivo.', requestId },
      { status: 500 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  }
}
