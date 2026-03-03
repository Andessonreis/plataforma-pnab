import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'

export const runtime = 'nodejs'

// -- DELETE — Excluir item FAQ -------------------------------------------------

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso negado.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const { id } = await context.params

    const existing = await prisma.faqItem.findUnique({ where: { id } })
    if (!existing) {
      const res = NextResponse.json(
        { error: 'NOT_FOUND', message: 'Item de FAQ nao encontrado.', requestId },
        { status: 404 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    await prisma.faqItem.delete({ where: { id } })

    await logAudit({
      userId: session.user.id,
      action: 'FAQ_EXCLUIDO',
      entity: 'FaqItem',
      entityId: id,
      details: { pergunta: existing.pergunta },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const res = NextResponse.json(
      { message: 'Item de FAQ excluido.', requestId },
      { status: 200 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'DELETE',
      path: `/api/admin/faq/${id}`,
      status: 200,
      durationMs: Date.now() - start,
    })

    return res
  } catch (err) {
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })

    const res = NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro interno.', requestId },
      { status: 500 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  }
}
