import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { uploadFile, deleteFile } from '@/lib/storage'
import { validateMagicBytes, sanitizeFilename } from '@/lib/upload/validate'
import { logAudit } from '@/lib/audit'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const ALLOWED_MIMES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
]

interface RouteParams {
  params: Promise<{ id: string }>
}

// ─── POST — Upload de anexo ─────────────────────────────────────────────────

export async function POST(req: NextRequest, { params }: RouteParams) {
  const requestId = randomUUID()
  const start = Date.now()
  const { id } = await params

  try {
    const session = await auth()
    if (!session || session.user.role !== 'PROPONENTE') {
      const res = NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Acesso negado.', requestId },
        { status: 401 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const inscricao = await prisma.inscricao.findUnique({
      where: { id },
      select: { id: true, proponenteId: true, status: true },
    })

    if (!inscricao) {
      const res = NextResponse.json(
        { error: 'NOT_FOUND', message: 'Inscrição não encontrada.', requestId },
        { status: 404 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    if (inscricao.proponenteId !== session.user.id) {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso negado.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    if (inscricao.status !== 'RASCUNHO') {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'Apenas rascunhos podem receber anexos.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const tipo = formData.get('tipo') as string | null
    const titulo = formData.get('titulo') as string | null

    if (!file || !tipo || !titulo) {
      const res = NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Campos file, tipo e titulo são obrigatórios.', requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // Validar tamanho
    if (file.size > MAX_FILE_SIZE) {
      const res = NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Arquivo excede o limite de 10MB.', requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // Validar MIME type
    if (!ALLOWED_MIMES.includes(file.type)) {
      const res = NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Tipo de arquivo não permitido. Aceitos: PDF, PNG, JPEG.', requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // Validar magic bytes
    const buffer = Buffer.from(await file.arrayBuffer())
    if (!validateMagicBytes(buffer, file.type)) {
      const res = NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Conteúdo do arquivo não corresponde ao tipo declarado.', requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // Upload para Supabase
    const safeName = sanitizeFilename(file.name)
    const storagePath = `inscricoes/${id}/${safeName}`
    const url = await uploadFile('propostas', storagePath, buffer, file.type)

    // Criar registro no banco
    const anexo = await prisma.anexoInscricao.create({
      data: {
        inscricaoId: id,
        tipo,
        titulo,
        url,
      },
      select: { id: true, url: true, titulo: true, tipo: true, createdAt: true },
    })

    await logAudit({
      userId: session.user.id,
      action: 'ANEXO_ENVIADO',
      entity: 'AnexoInscricao',
      entityId: anexo.id,
      details: { inscricaoId: id, tipo, filename: safeName },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const res = NextResponse.json(
      { data: anexo, requestId },
      { status: 201 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({ requestId, method: 'POST', path: `/api/proponente/inscricoes/${id}/anexos`, status: 201, durationMs: Date.now() - start })
    return res
  } catch (err) {
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    const res = NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro interno. Tente novamente.', requestId },
      { status: 500 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  }
}

// ─── DELETE — Remover anexo ─────────────────────────────────────────────────

const deleteSchema = z.object({
  anexoId: z.string().min(1, 'anexoId é obrigatório'),
})

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const requestId = randomUUID()
  const start = Date.now()
  const { id } = await params

  try {
    const session = await auth()
    if (!session || session.user.role !== 'PROPONENTE') {
      const res = NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Acesso negado.', requestId },
        { status: 401 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const body = await req.json()
    const data = deleteSchema.parse(body)

    const anexo = await prisma.anexoInscricao.findUnique({
      where: { id: data.anexoId },
      include: {
        inscricao: {
          select: { id: true, proponenteId: true, status: true },
        },
      },
    })

    if (!anexo || anexo.inscricao.id !== id) {
      const res = NextResponse.json(
        { error: 'NOT_FOUND', message: 'Anexo não encontrado.', requestId },
        { status: 404 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    if (anexo.inscricao.proponenteId !== session.user.id) {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso negado.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    if (anexo.inscricao.status !== 'RASCUNHO') {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'Apenas rascunhos podem ter anexos removidos.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // Extrair path do Supabase a partir da URL
    const urlObj = new URL(anexo.url)
    const storagePath = urlObj.pathname.split('/propostas/').pop()
    if (storagePath) {
      try {
        await deleteFile('propostas', storagePath)
      } catch {
        // Continua mesmo se falhar a remoção do storage
        console.error({ requestId, message: 'Falha ao remover arquivo do storage', storagePath })
      }
    }

    await prisma.anexoInscricao.delete({ where: { id: data.anexoId } })

    const res = NextResponse.json({ message: 'Anexo removido.', requestId })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({ requestId, method: 'DELETE', path: `/api/proponente/inscricoes/${id}/anexos`, status: 200, durationMs: Date.now() - start })
    return res
  } catch (err) {
    if (err instanceof z.ZodError) {
      const res = NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Dados inválidos.', requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    const res = NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro interno. Tente novamente.', requestId },
      { status: 500 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  }
}
