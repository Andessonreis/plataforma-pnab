import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { avancarFaseEdital, getPreFlightInfo } from '@/lib/edital/avancar-fase'

export const runtime = 'nodejs'

/**
 * GET — Retorna info de pré-voo (próxima fase, pendências, KPIs).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = randomUUID()

  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'FORBIDDEN', message: 'Acesso negado.', requestId },
      { status: 403 },
    )
  }

  const { id } = await params
  const info = await getPreFlightInfo(id)

  if (!info) {
    return NextResponse.json(
      { error: 'NOT_FOUND', message: 'Edital não encontrado.', requestId },
      { status: 404 },
    )
  }

  return NextResponse.json({ ...info, requestId })
}

/**
 * POST — Avança o edital para a próxima fase manual.
 */
export async function POST(
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
    const ip = req.headers.get('x-forwarded-for') ?? undefined

    const result = await avancarFaseEdital(id, session.user.id, ip)

    if (!result.ok) {
      return NextResponse.json(
        { error: 'BLOCKED', message: result.error, pendencias: result.pendencias, requestId },
        { status: 422 },
      )
    }

    const res = NextResponse.json({
      message: `Edital avançado para ${result.novoStatus}.`,
      novoStatus: result.novoStatus,
      requestId,
    })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'POST',
      path: `/api/admin/editais/${id}/avancar-fase`,
      status: 200,
      durationMs: Date.now() - start,
    })

    return res
  } catch (err) {
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro interno.', requestId },
      { status: 500 },
    )
  }
}
