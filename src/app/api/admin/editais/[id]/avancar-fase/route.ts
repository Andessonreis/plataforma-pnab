import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import type { EditalStatus } from '@prisma/client'

export const runtime = 'nodejs'

/**
 * POST /api/admin/editais/[id]/avancar-fase
 *
 * Transição manual de fase do edital. Sempre que possível, prefira deixar
 * o scheduler automático fazer a transição (baseado nas datas do
 * cronograma). Esta rota existe para casos excepcionais — correção,
 * decisão administrativa fora do prazo, etc. — e exige justificativa
 * que fica registrada em audit log.
 */

const SEQUENCIA_FASES: EditalStatus[] = [
  'RASCUNHO',
  'PUBLICADO',
  'INSCRICOES_ABERTAS',
  'INSCRICOES_ENCERRADAS',
  'HABILITACAO',
  'AVALIACAO',
  'RESULTADO_PRELIMINAR',
  'RECURSO',
  'RESULTADO_FINAL',
  'ENCERRADO',
]

const bodySchema = z.object({
  proximoStatus: z.enum([
    'RASCUNHO', 'PUBLICADO', 'INSCRICOES_ABERTAS', 'INSCRICOES_ENCERRADAS',
    'HABILITACAO', 'AVALIACAO', 'RESULTADO_PRELIMINAR', 'RECURSO',
    'RESULTADO_FINAL', 'ENCERRADO',
  ]),
  justificativa: z.string().trim().min(10, 'Justificativa precisa de ao menos 10 caracteres').max(1000),
})

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
        { error: 'FORBIDDEN', message: 'Apenas ADMIN pode avançar fase manualmente.', requestId },
        { status: 403, headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
      )
    }

    const { id } = await params
    const body = await req.json()
    const data = bodySchema.parse(body)

    const edital = await prisma.edital.findUnique({
      where: { id },
      select: { id: true, status: true, titulo: true, publishedAt: true },
    })

    if (!edital) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Edital não encontrado.', requestId },
        { status: 404, headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
      )
    }

    const statusAtual = edital.status as EditalStatus
    if (statusAtual === data.proximoStatus) {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'O edital já está nesse status.', requestId },
        { status: 400, headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
      )
    }

    const idxAtual = SEQUENCIA_FASES.indexOf(statusAtual)
    const idxNovo = SEQUENCIA_FASES.indexOf(data.proximoStatus)
    const isRetrocesso = idxNovo < idxAtual

    // Atualiza status (e publishedAt se estiver saindo de RASCUNHO pela primeira vez)
    const updateData: Record<string, unknown> = { status: data.proximoStatus }
    if (statusAtual === 'RASCUNHO' && data.proximoStatus !== 'RASCUNHO' && !edital.publishedAt) {
      updateData.publishedAt = new Date()
    }

    await prisma.edital.update({
      where: { id },
      data: updateData,
    })

    // Audit log marcando origem manual (diferenciar do scheduler automático)
    await logAudit({
      userId: session.user.id,
      action: 'EDITAL_FASE_AVANCADA_MANUAL',
      entity: 'Edital',
      entityId: id,
      details: {
        statusAnterior: statusAtual,
        novoStatus: data.proximoStatus,
        justificativa: data.justificativa,
        retrocesso: isRetrocesso,
        editalTitulo: edital.titulo,
      },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const res = NextResponse.json(
      {
        message: `Edital atualizado para ${data.proximoStatus}.`,
        statusAnterior: statusAtual,
        novoStatus: data.proximoStatus,
        retrocesso: isRetrocesso,
        requestId,
      },
      { status: 200 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    console.log({
      requestId,
      method: 'POST',
      path: `/api/admin/editais/${id}/avancar-fase`,
      status: 200,
      statusAnterior: statusAtual,
      novoStatus: data.proximoStatus,
      durationMs: Date.now() - start,
    })
    return res
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: err.errors[0].message, requestId },
        { status: 400, headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
      )
    }
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro interno.', requestId },
      { status: 500, headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
    )
  }
}
