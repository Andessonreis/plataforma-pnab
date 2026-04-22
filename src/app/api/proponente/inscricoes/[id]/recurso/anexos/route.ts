import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { uploadFile } from '@/lib/storage'
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

/**
 * POST — Upload de anexo do recurso (evidência).
 * O proponente envia um arquivo por vez. A resposta retorna a URL pública
 * que deve ser incluída no array `urlAnexos` ao submeter o recurso.
 */
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

    // Só aceita upload de anexo de recurso se a inscrição está num status
    // que permite recurso (INABILITADA, RESULTADO_PRELIMINAR, NAO_CONTEMPLADA, SUPLENTE)
    const STATUS_RECURSO = ['INABILITADA', 'RESULTADO_PRELIMINAR', 'NAO_CONTEMPLADA', 'SUPLENTE']
    if (!STATUS_RECURSO.includes(inscricao.status)) {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'O status atual da inscrição não permite recurso.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      const res = NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Campo file é obrigatório.', requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    if (file.size > MAX_FILE_SIZE) {
      const res = NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Arquivo excede o limite de 10MB.', requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    if (!ALLOWED_MIMES.includes(file.type)) {
      const res = NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Tipo de arquivo não permitido. Aceitos: PDF, PNG, JPEG.', requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

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

    const safeName = sanitizeFilename(file.name)
    // Prefixo com timestamp pra evitar colisão entre múltiplos uploads do mesmo arquivo
    const storagePath = `recursos/${id}/${Date.now()}_${safeName}`
    const url = await uploadFile('propostas', storagePath, buffer, file.type)

    await logAudit({
      userId: session.user.id,
      action: 'RECURSO_ANEXO_ENVIADO',
      entity: 'Recurso',
      entityId: id,
      details: { inscricaoId: id, filename: safeName, url },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const res = NextResponse.json({ url, filename: safeName, requestId })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    console.log({ requestId, method: 'POST', path: `/api/proponente/inscricoes/${id}/recurso/anexos`, status: 200, durationMs: Date.now() - start })
    return res
  } catch (err) {
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    const res = NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro ao enviar anexo.', requestId },
      { status: 500 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  }
}
