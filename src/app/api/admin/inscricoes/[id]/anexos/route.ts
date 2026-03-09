import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getSignedUrl } from '@/lib/storage'

export const runtime = 'nodejs'

const INTERNAL_ROLES = ['ADMIN', 'HABILITADOR', 'AVALIADOR', 'ATENDIMENTO']

interface RouteParams {
  params: Promise<{ id: string }>
}

// ─── GET — Gerar signed URL para um anexo ──────────────────────────────────

export async function GET(req: NextRequest, { params }: RouteParams) {
  const requestId = randomUUID()
  const start = Date.now()
  const { id } = await params

  try {
    const session = await auth()
    if (!session || !INTERNAL_ROLES.includes(session.user.role)) {
      const res = NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Acesso negado.', requestId },
        { status: 401 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const anexoId = new URL(req.url).searchParams.get('anexoId')
    if (!anexoId) {
      const res = NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Parâmetro anexoId é obrigatório.', requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const anexo = await prisma.anexoInscricao.findUnique({
      where: { id: anexoId },
      select: { id: true, url: true, inscricaoId: true },
    })

    if (!anexo || anexo.inscricaoId !== id) {
      const res = NextResponse.json(
        { error: 'NOT_FOUND', message: 'Anexo não encontrado.', requestId },
        { status: 404 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // Extrair path do storage a partir da URL pública
    const urlObj = new URL(anexo.url)
    const storagePath = urlObj.pathname.split('/propostas/').pop()

    if (!storagePath) {
      const res = NextResponse.json(
        { error: 'INTERNAL_ERROR', message: 'Caminho do arquivo inválido.', requestId },
        { status: 500 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const signedUrl = await getSignedUrl('propostas', storagePath, 3600)

    const res = NextResponse.json({ url: signedUrl, requestId })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({ requestId, method: 'GET', path: `/api/admin/inscricoes/${id}/anexos`, status: 200, durationMs: Date.now() - start })
    return res
  } catch (err) {
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    const res = NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro ao gerar URL do anexo.', requestId },
      { status: 500 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  }
}
