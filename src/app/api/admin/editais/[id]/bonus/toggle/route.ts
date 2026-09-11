import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'

export const runtime = 'nodejs'

const bodySchema = z.object({ visivel: z.boolean() })

interface RouteContext {
  params: Promise<{ id: string }>
}

// ── POST — Liga/desliga a visibilidade da nota bônus pra ADMIN comum ────────
// Só SUPER_ADMIN pode chamar. SUPER_ADMIN em si nunca depende deste campo.
export async function POST(req: NextRequest, ctx: RouteContext) {
  const requestId = randomUUID()

  try {
    const session = await auth()
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso restrito ao super admin', requestId },
        { status: 403, headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
      )
    }

    const { id: editalId } = await ctx.params
    const { visivel } = bodySchema.parse(await req.json())

    const edital = await prisma.edital.update({
      where: { id: editalId },
      data: { bonusVisivelParaAdmin: visivel },
      select: { id: true, titulo: true, bonusVisivelParaAdmin: true },
    })

    await logAudit({
      userId: session.user.id,
      action: AUDIT_ACTIONS.BONUS_VISIBILIDADE_ALTERADA,
      entity: 'Edital',
      entityId: editalId,
      details: { editalTitulo: edital.titulo, visivel },
    })

    const res = NextResponse.json({ ok: true, bonusVisivelParaAdmin: edital.bonusVisivelParaAdmin })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Dados inválidos', requestId },
        { status: 400, headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
      )
    }
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', requestId },
      { status: 500, headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
    )
  }
}
