import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { auth } from '@server/lib/auth'
import { prisma } from '@server/lib/db'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'
import { ruleSchema } from '@/lib/notifications/schemas'
import { isTriggerImplementado } from '@/lib/notifications/triggers'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = randomUUID()

  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') return forbidden(requestId)

    const { id } = await params
    const rule = await prisma.notificationRule.findUnique({
      where: { id },
      include: {
        _count: { select: { campaigns: true } },
        createdBy: { select: { id: true, nome: true } },
      },
    })

    if (!rule) return notFound(requestId)

    const res = NextResponse.json({ data: rule, requestId })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (err) {
    return handleError(err, requestId)
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = randomUUID()

  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') return forbidden(requestId)

    const { id } = await params
    const existing = await prisma.notificationRule.findUnique({ where: { id } })
    if (!existing) return notFound(requestId)

    const body = await req.json()
    const data = ruleSchema.parse(body)

    if (!isTriggerImplementado(data.trigger)) {
      const res = NextResponse.json(
        {
          error: 'CONFLICT',
          message: `Trigger ${data.trigger} ainda não implementado.`,
          requestId,
        },
        { status: 409 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const rule = await prisma.notificationRule.update({
      where: { id },
      data: {
        nome: data.nome,
        descricao: data.descricao ?? null,
        trigger: data.trigger,
        // ativo NÃO é atualizado aqui — usar /toggle
        config: data.config as object,
        assunto: data.assunto,
        corpo: data.corpo,
        link: data.link ?? null,
        ctaLabel: data.ctaLabel ?? null,
        canais: data.canais,
        filtro: data.filtro as object,
      },
    })

    await logAudit({
      userId: session.user.id,
      action: AUDIT_ACTIONS.NOTIFICACAO_REGRA_ATUALIZADA,
      entity: 'NotificationRule',
      entityId: rule.id,
      details: { nome: rule.nome, trigger: rule.trigger },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const res = NextResponse.json({ message: 'Regra atualizada.', id: rule.id, requestId })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (err) {
    return handleError(err, requestId)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = randomUUID()

  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') return forbidden(requestId)

    const { id } = await params
    const existing = await prisma.notificationRule.findUnique({ where: { id } })
    if (!existing) return notFound(requestId)

    // Cuidado: campanhas geradas ficam com ruleId = NULL (onDelete SetNull no schema)
    await prisma.notificationRule.delete({ where: { id } })

    await logAudit({
      userId: session.user.id,
      action: AUDIT_ACTIONS.NOTIFICACAO_REGRA_EXCLUIDA,
      entity: 'NotificationRule',
      entityId: id,
      details: { nome: existing.nome, trigger: existing.trigger },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const res = NextResponse.json({ message: 'Regra excluída.', requestId })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (err) {
    return handleError(err, requestId)
  }
}

function forbidden(requestId: string) {
  const res = NextResponse.json(
    { error: 'FORBIDDEN', message: 'Acesso negado.', requestId },
    { status: 403 },
  )
  res.headers.set('X-Request-Id', requestId)
  res.headers.set('Cache-Control', 'no-store')
  return res
}

function notFound(requestId: string) {
  const res = NextResponse.json(
    { error: 'NOT_FOUND', message: 'Regra não encontrada.', requestId },
    { status: 404 },
  )
  res.headers.set('X-Request-Id', requestId)
  res.headers.set('Cache-Control', 'no-store')
  return res
}

function handleError(err: unknown, requestId: string) {
  if (err instanceof z.ZodError) {
    const fieldErrors: Record<string, string> = {}
    for (const e of err.errors) fieldErrors[e.path.join('.')] = e.message
    const res = NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'Dados inválidos.', fieldErrors, requestId },
      { status: 400 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  }
  console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
  const res = NextResponse.json(
    { error: 'INTERNAL_ERROR', message: 'Erro interno.', requestId },
    { status: 500 },
  )
  res.headers.set('X-Request-Id', requestId)
  res.headers.set('Cache-Control', 'no-store')
  return res
}
