import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'

export const runtime = 'nodejs'

// ── Schemas ─────────────────────────────────────────────────────────────────

const assignSchema = z.object({
  avaliadorIds: z.array(z.string().min(1)).min(1, 'Informe ao menos um avaliador'),
})

const removeSchema = z.object({
  avaliadorId: z.string().min(1, 'ID do avaliador é obrigatório'),
})

interface RouteContext {
  params: Promise<{ id: string }>
}

// ── POST — Atribuir avaliadores ─────────────────────────────────────────────

export async function POST(req: NextRequest, ctx: RouteContext) {
  const requestId = randomUUID()
  const start = Date.now()
  const { id: inscricaoId } = await ctx.params

  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso restrito a administradores', requestId },
        { status: 403, headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
      )
    }

    const body = await req.json()
    const { avaliadorIds } = assignSchema.parse(body)

    const result = await prisma.$transaction(async (tx) => {
      // Verificar inscrição
      const inscricao = await tx.inscricao.findUnique({
        where: { id: inscricaoId },
        select: { id: true, status: true, numero: true },
      })

      if (!inscricao) {
        throw new Error('NOT_FOUND')
      }

      if (inscricao.status !== 'HABILITADA' && inscricao.status !== 'EM_AVALIACAO') {
        throw new Error('INVALID_STATUS')
      }

      // Verificar que todos os IDs são avaliadores válidos
      const avaliadores = await tx.user.findMany({
        where: { id: { in: avaliadorIds }, role: 'AVALIADOR', ativo: true },
        select: { id: true, nome: true },
      })

      if (avaliadores.length !== avaliadorIds.length) {
        throw new Error('INVALID_AVALIADORES')
      }

      // Filtrar os já atribuídos
      const existing = await tx.avaliacao.findMany({
        where: { inscricaoId, avaliadorId: { in: avaliadorIds } },
        select: { avaliadorId: true },
      })
      const existingIds = new Set(existing.map((e) => e.avaliadorId))
      const newIds = avaliadorIds.filter((id) => !existingIds.has(id))

      if (newIds.length === 0) {
        return { created: 0, inscricao }
      }

      // Criar avaliações
      await tx.avaliacao.createMany({
        data: newIds.map((avaliadorId) => ({
          inscricaoId,
          avaliadorId,
          notas: [],
          notaTotal: 0,
          finalizada: false,
        })),
      })

      // Atualizar status para EM_AVALIACAO se estava HABILITADA
      if (inscricao.status === 'HABILITADA') {
        await tx.inscricao.update({
          where: { id: inscricaoId },
          data: { status: 'EM_AVALIACAO' },
        })
      }

      return { created: newIds.length, inscricao, newIds }
    })

    // Audit log (fora da transaction)
    if (result.created > 0 && result.newIds) {
      await logAudit({
        userId: session.user.id,
        action: AUDIT_ACTIONS.AVALIADOR_ATRIBUIDO,
        entity: 'Inscricao',
        entityId: inscricaoId,
        details: { avaliadorIds: result.newIds, numero: result.inscricao.numero },
      })
    }

    const res = NextResponse.json(
      { message: `${result.created} avaliador(es) atribuído(s)`, created: result.created },
      { status: 201 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({ requestId, method: 'POST', path: `/api/admin/inscricoes/${inscricaoId}/avaliacao/assign`, status: 201, durationMs: Date.now() - start })
    return res
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown'

    if (message === 'NOT_FOUND') {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Inscrição não encontrada', requestId },
        { status: 404, headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
      )
    }
    if (message === 'INVALID_STATUS') {
      return NextResponse.json(
        { error: 'INVALID_STATUS', message: 'Inscrição deve estar HABILITADA ou EM_AVALIACAO', requestId },
        { status: 422, headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
      )
    }
    if (message === 'INVALID_AVALIADORES') {
      return NextResponse.json(
        { error: 'INVALID_AVALIADORES', message: 'Um ou mais avaliadores inválidos', requestId },
        { status: 400, headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
      )
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Dados inválidos', errors: err.errors, requestId },
        { status: 400, headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
      )
    }

    console.error({ requestId, error: message })
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro ao atribuir avaliadores', requestId },
      { status: 500, headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
    )
  }
}

// ── DELETE — Remover avaliador ──────────────────────────────────────────────

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const requestId = randomUUID()
  const start = Date.now()
  const { id: inscricaoId } = await ctx.params

  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso restrito a administradores', requestId },
        { status: 403, headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
      )
    }

    const body = await req.json()
    const { avaliadorId } = removeSchema.parse(body)

    await prisma.$transaction(async (tx) => {
      // Verificar inscrição existe
      const inscricao = await tx.inscricao.findUnique({
        where: { id: inscricaoId },
        select: { id: true, status: true, numero: true },
      })

      if (!inscricao) {
        throw new Error('NOT_FOUND')
      }

      // Verificar avaliação existe
      const avaliacao = await tx.avaliacao.findUnique({
        where: { inscricaoId_avaliadorId: { inscricaoId, avaliadorId } },
        select: { id: true, finalizada: true },
      })

      if (!avaliacao) {
        throw new Error('NOT_FOUND')
      }

      if (avaliacao.finalizada) {
        throw new Error('FINALIZADA')
      }

      // Remover avaliação
      await tx.avaliacao.delete({
        where: { inscricaoId_avaliadorId: { inscricaoId, avaliadorId } },
      })

      // Se não sobrar nenhum avaliador, reverter status para HABILITADA
      const remaining = await tx.avaliacao.count({ where: { inscricaoId } })
      if (remaining === 0 && inscricao.status === 'EM_AVALIACAO') {
        await tx.inscricao.update({
          where: { id: inscricaoId },
          data: { status: 'HABILITADA' },
        })
      }
    })

    // Audit log
    await logAudit({
      userId: session.user.id,
      action: AUDIT_ACTIONS.AVALIADOR_REMOVIDO,
      entity: 'Inscricao',
      entityId: inscricaoId,
      details: { avaliadorId },
    })

    const res = NextResponse.json({ message: 'Avaliador removido' })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({ requestId, method: 'DELETE', path: `/api/admin/inscricoes/${inscricaoId}/avaliacao/assign`, status: 200, durationMs: Date.now() - start })
    return res
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown'

    if (message === 'NOT_FOUND') {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Avaliação não encontrada', requestId },
        { status: 404, headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
      )
    }
    if (message === 'FINALIZADA') {
      return NextResponse.json(
        { error: 'LOCKED', message: 'Não é possível remover avaliação já finalizada', requestId },
        { status: 422, headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
      )
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Dados inválidos', errors: err.errors, requestId },
        { status: 400, headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
      )
    }

    console.error({ requestId, error: message })
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro ao remover avaliador', requestId },
      { status: 500, headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
    )
  }
}
