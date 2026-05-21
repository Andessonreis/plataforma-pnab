import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { auth } from '@server/lib/auth'
import { prisma } from '@server/lib/db'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'

export const runtime = 'nodejs'

const postSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1),
  funcao: z.enum(['AVALIADOR', 'HABILITADOR']),
})

const deleteSchema = z.object({
  userId: z.string().min(1),
  funcao: z.enum(['AVALIADOR', 'HABILITADOR']),
})

interface RouteContext {
  params: Promise<{ id: string }>
}

// ── GET — Listar membros do edital ──────────────────────────────────────────

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'FORBIDDEN', requestId },
        { status: 403, headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
      )
    }

    const { id } = await ctx.params

    const membros = await prisma.editalMembro.findMany({
      where: { editalId: id },
      include: { user: { select: { id: true, nome: true, email: true } } },
    })

    const avaliadores = membros
      .filter((m) => m.funcao === 'AVALIADOR')
      .map((m) => ({ id: m.user.id, nome: m.user.nome, email: m.user.email }))

    const habilitadores = membros
      .filter((m) => m.funcao === 'HABILITADOR')
      .map((m) => ({ id: m.user.id, nome: m.user.nome, email: m.user.email }))

    const res = NextResponse.json({ avaliadores, habilitadores })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({ requestId, method: 'GET', path: `/api/admin/editais/${id}/equipe`, status: 200, durationMs: Date.now() - start })
    return res
  } catch (err) {
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', requestId },
      { status: 500, headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
    )
  }
}

// ── POST — Adicionar membros ao edital ──────────────────────────────────────

export async function POST(req: NextRequest, ctx: RouteContext) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'FORBIDDEN', requestId },
        { status: 403, headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
      )
    }

    const { id: editalId } = await ctx.params
    const body = await req.json()
    const { userIds, funcao } = postSchema.parse(body)

    // Verificar que o edital existe
    const edital = await prisma.edital.findUnique({
      where: { id: editalId },
      select: { id: true },
    })
    if (!edital) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Edital não encontrado', requestId },
        { status: 404, headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
      )
    }

    // Validar que os users existem, estão ativos e têm o role correto
    const expectedRole = funcao === 'AVALIADOR' ? 'AVALIADOR' : 'HABILITADOR'
    const users = await prisma.user.findMany({
      where: { id: { in: userIds }, ativo: true, role: expectedRole },
      select: { id: true, nome: true },
    })

    const validIds = users.map((u) => u.id)
    const invalidIds = userIds.filter((uid) => !validIds.includes(uid))

    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: `Usuários inválidos: ${invalidIds.join(', ')}`, requestId },
        { status: 400, headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
      )
    }

    // Criar membros (skip duplicates)
    await prisma.editalMembro.createMany({
      data: validIds.map((userId) => ({
        editalId,
        userId,
        funcao,
      })),
      skipDuplicates: true,
    })

    // Audit
    for (const user of users) {
      await logAudit({
        userId: session.user.id,
        action: AUDIT_ACTIONS.MEMBRO_EDITAL_ADICIONADO,
        entity: 'EditalMembro',
        entityId: editalId,
        details: { funcao, membroId: user.id, membroNome: user.nome },
      })
    }

    const res = NextResponse.json({ ok: true, added: validIds.length })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({ requestId, method: 'POST', path: `/api/admin/editais/${editalId}/equipe`, status: 200, durationMs: Date.now() - start })
    return res
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Dados inválidos', details: err.errors, requestId },
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

// ── DELETE — Remover membro do edital ───────────────────────────────────────

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'FORBIDDEN', requestId },
        { status: 403, headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
      )
    }

    const { id: editalId } = await ctx.params
    const body = await req.json()
    const { userId, funcao } = deleteSchema.parse(body)

    const deleted = await prisma.editalMembro.deleteMany({
      where: { editalId, userId, funcao },
    })

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Membro não encontrado', requestId },
        { status: 404, headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
      )
    }

    await logAudit({
      userId: session.user.id,
      action: AUDIT_ACTIONS.MEMBRO_EDITAL_REMOVIDO,
      entity: 'EditalMembro',
      entityId: editalId,
      details: { funcao, membroId: userId },
    })

    const res = NextResponse.json({ ok: true })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({ requestId, method: 'DELETE', path: `/api/admin/editais/${editalId}/equipe`, status: 200, durationMs: Date.now() - start })
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
