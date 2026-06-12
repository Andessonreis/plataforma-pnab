import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { responderRecurso } from '@/lib/services/recurso.service'
import { ServiceError } from '@/lib/services/errors'

export const runtime = 'nodejs'

const respostaSchema = z.object({
  decisao: z.enum(['DEFERIDO', 'INDEFERIDO']),
  justificativa: z.string().min(10, 'Justificativa deve ter no mínimo 10 caracteres'),
})

// POST — Avaliador responde o recurso (cego entre avaliadores)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; recursoId: string }> },
) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const session = await auth()
    if (!session || session.user.role !== 'AVALIADOR') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso negado.', requestId },
        { status: 403 },
      )
    }

    const { id, recursoId } = await params
    const data = respostaSchema.parse(await req.json())

    const estado = await responderRecurso(
      id,
      recursoId,
      data,
      session.user.id,
      req.headers.get('x-forwarded-for') ?? undefined,
    )

    const res = NextResponse.json({ message: 'Resposta registrada.', estado, requestId })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    console.log({ requestId, method: 'POST', path: `/api/admin/inscricoes/${id}/recurso/${recursoId}/resposta`, status: 200, durationMs: Date.now() - start })
    return res
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: err.errors[0].message, requestId },
        { status: 400 },
      )
    }
    if (err instanceof ServiceError) {
      return NextResponse.json(
        { error: err.code, message: err.message, requestId },
        { status: err.httpStatus },
      )
    }
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro ao responder recurso.', requestId },
      { status: 500 },
    )
  }
}
