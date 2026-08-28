import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { ServiceError } from '@/lib/services/errors'
import { registrarRetificacaoSchema } from '@/lib/schemas/retificacao'
import { desfazerRetificacao, registrarRetificacao } from '@/lib/services/retificacao.service'

export const runtime = 'nodejs'

/**
 * POST   /api/admin/editais/[id]/retificacao  — registra o ato e aplica as datas
 * DELETE /api/admin/editais/[id]/retificacao?numero=01 — desfaz o ato
 *
 * Retificar um edital no ar muda o que o cidadão lê sobre prazos, então é
 * exclusivo de ADMIN e fica registrado em auditoria com o número e a data de
 * publicação no Diário Oficial.
 */

function erro(status: number, code: string, message: string, requestId: string) {
  return NextResponse.json(
    { error: code, message, requestId },
    { status, headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
  )
}

async function exigirAdmin(requestId: string) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return {
      session: null,
      resposta: erro(403, 'FORBIDDEN', 'Apenas ADMIN pode retificar um edital.', requestId),
    }
  }
  return { session, resposta: null }
}

function tratarFalha(err: unknown, requestId: string, path: string) {
  if (err instanceof ServiceError) {
    return erro(err.httpStatus, err.code, err.message, requestId)
  }
  if (err instanceof z.ZodError) {
    return erro(400, 'VALIDATION_ERROR', err.errors[0].message, requestId)
  }
  console.error({ requestId, path, error: err instanceof Error ? err.message : 'Unknown' })
  return erro(500, 'INTERNAL_ERROR', 'Erro interno.', requestId)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = randomUUID()
  const start = Date.now()
  const { id } = await params
  const path = `/api/admin/editais/${id}/retificacao`

  try {
    const { session, resposta } = await exigirAdmin(requestId)
    if (!session) return resposta

    const data = registrarRetificacaoSchema.parse(await req.json())
    const { retificacao, marcosAlterados } = await registrarRetificacao(id, data, {
      userId: session.user.id,
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    console.log({ requestId, method: 'POST', path, status: 201, marcosAlterados, durationMs: Date.now() - start })

    return NextResponse.json(
      {
        message: `Retificação nº ${retificacao.numero} registrada. ${marcosAlterados} marco(s) do cronograma alterado(s).`,
        retificacao,
        marcosAlterados,
        requestId,
      },
      { status: 201, headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
    )
  } catch (err) {
    return tratarFalha(err, requestId, path)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = randomUUID()
  const start = Date.now()
  const { id } = await params
  const path = `/api/admin/editais/${id}/retificacao`

  try {
    const { session, resposta } = await exigirAdmin(requestId)
    if (!session) return resposta

    const numero = new URL(req.url).searchParams.get('numero')?.trim()
    if (!numero) {
      return erro(400, 'VALIDATION_ERROR', 'Informe o número da retificação a desfazer.', requestId)
    }

    const { marcosRestaurados } = await desfazerRetificacao(id, numero, {
      userId: session.user.id,
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    console.log({ requestId, method: 'DELETE', path, status: 200, marcosRestaurados, durationMs: Date.now() - start })

    return NextResponse.json(
      {
        message: `Retificação nº ${numero} desfeita. ${marcosRestaurados} marco(s) restaurado(s).`,
        marcosRestaurados,
        requestId,
      },
      { status: 200, headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
    )
  } catch (err) {
    return tratarFalha(err, requestId, path)
  }
}
