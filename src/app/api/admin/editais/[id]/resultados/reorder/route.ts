import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { auth } from '@server/lib/auth'
import { logAudit } from '@/lib/audit'
import { saveManualOrder } from '@/lib/results/calculate'

export const runtime = 'nodejs'

const reorderSchema = z.object({
  orderedIds: z.array(z.string()).min(1, 'Informe ao menos um ID'),
})

// PATCH — Reordenar inscrições empatadas (desempate manual)
export async function PATCH(
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
    const { orderedIds } = reorderSchema.parse(body)

    await saveManualOrder(id, orderedIds)

    await logAudit({
      userId: session.user.id,
      action: 'DESEMPATE_MANUAL',
      entity: 'Edital',
      entityId: id,
      details: { orderedIds },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const res = NextResponse.json({
      message: 'Ordem de desempate salva com sucesso.',
      requestId,
    })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    console.log({ requestId, method: 'PATCH', path: `/api/admin/editais/${id}/resultados/reorder`, status: 200, durationMs: Date.now() - start })
    return res
  } catch (err) {
    if (err instanceof z.ZodError) {
      const res = NextResponse.json(
        { error: 'VALIDATION_ERROR', message: err.errors[0]?.message ?? 'Dados inválidos.', requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    const status = message.includes('não pertence') ? 400 : 500
    console.error({ requestId, error: message })
    const res = NextResponse.json(
      { error: status === 400 ? 'BAD_REQUEST' : 'INTERNAL_ERROR', message, requestId },
      { status },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  }
}
