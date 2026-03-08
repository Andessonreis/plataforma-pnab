import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { sanitizeContent } from '@/lib/sanitize'

export const runtime = 'nodejs'

const bodySchema = z.object({
  conteudoAcessivel: z.string().min(1, 'Conteúdo é obrigatório'),
})

// PUT — Salvar conteúdo acessível de um edital
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso negado.', requestId },
        { status: 403 },
      )
    }

    const { id } = await params
    const body = await req.json()
    const data = bodySchema.parse(body)

    const edital = await prisma.edital.findUnique({
      where: { id },
      select: { id: true, titulo: true },
    })

    if (!edital) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Edital não encontrado.', requestId },
        { status: 404 },
      )
    }

    // Sanitiza o conteúdo HTML antes de salvar
    const sanitized = sanitizeContent(data.conteudoAcessivel)

    await prisma.edital.update({
      where: { id },
      data: { conteudoAcessivel: sanitized },
    })

    await logAudit({
      userId: session.user.id,
      action: 'EDITAL_ATUALIZADO',
      entity: 'Edital',
      entityId: id,
      details: { campo: 'conteudoAcessivel' },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const res = NextResponse.json({
      message: 'Conteúdo acessível salvo com sucesso.',
      requestId,
    })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    console.log({ requestId, method: 'PUT', path: `/api/admin/editais/${id}/acessivel`, status: 200, durationMs: Date.now() - start })
    return res
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: err.errors[0].message, requestId },
        { status: 400 },
      )
    }
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro ao salvar conteúdo acessível.', requestId },
      { status: 500 },
    )
  }
}
