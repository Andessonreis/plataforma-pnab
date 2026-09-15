import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { reabrirAvaliacao } from '@/lib/services/avaliacao.service'
import { ServiceError } from '@/lib/services/errors'

export const runtime = 'nodejs'

const reabrirBodySchema = z.object({
  motivo: z.string().trim().min(1).optional(),
})

// ─── POST — reabre a própria avaliação finalizada (só o avaliador dono) ──────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const session = await auth()
    if (!session || session.user.role !== 'AVALIADOR') {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso negado.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const { id } = await params
    const rawBody = await req.json().catch(() => ({}))
    const { motivo } = reabrirBodySchema.parse(rawBody)

    const avaliacao = await reabrirAvaliacao(id, session.user.id, motivo)

    const res = NextResponse.json({ avaliacao, message: 'Avaliação reaberta para edição.' })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({ requestId, method: 'POST', path: `/api/admin/inscricoes/${id}/avaliacao/reabrir`, status: 200, durationMs: Date.now() - start })
    return res
  } catch (err) {
    if (err instanceof z.ZodError) {
      const res = NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Dados inválidos.', issues: err.issues, requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    if (err instanceof ServiceError) {
      const res = NextResponse.json(
        { error: err.code, message: err.message, requestId },
        { status: err.httpStatus },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const res = NextResponse.json(
      { error: 'INTERNAL', message: 'Erro interno.', requestId },
      { status: 500 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    return res
  }
}
