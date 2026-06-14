import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { auth } from '@server/lib/auth'
import { prisma } from '@server/lib/db'
import { getSignedUrl } from '@/lib/storage'

export const runtime = 'nodejs'

const INTERNAL_ROLES = ['ADMIN', 'HABILITADOR', 'AVALIADOR', 'ATENDIMENTO']

// GET — Signed URL para um anexo do recurso (bucket 'propostas' é privado)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; recursoId: string }> },
) {
  const requestId = randomUUID()

  try {
    const session = await auth()
    if (!session || !INTERNAL_ROLES.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Acesso negado.', requestId },
        { status: 401 },
      )
    }

    const { id, recursoId } = await params
    const url = new URL(req.url).searchParams.get('url')
    if (!url) {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Parâmetro url é obrigatório.', requestId },
        { status: 400 },
      )
    }

    const recurso = await prisma.recurso.findUnique({
      where: { id: recursoId },
      select: { inscricaoId: true, urlAnexos: true },
    })

    if (!recurso || recurso.inscricaoId !== id || !recurso.urlAnexos.includes(url)) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Anexo não encontrado.', requestId },
        { status: 404 },
      )
    }

    const storagePath = new URL(url).pathname.split('/propostas/').pop()
    if (!storagePath) {
      return NextResponse.json(
        { error: 'INTERNAL_ERROR', message: 'Caminho do arquivo inválido.', requestId },
        { status: 500 },
      )
    }

    const signedUrl = await getSignedUrl('propostas', storagePath, 3600)

    const res = NextResponse.json({ url: signedUrl, requestId })
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (err) {
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro ao gerar URL do anexo.', requestId },
      { status: 500 },
    )
  }
}
