import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { AUDIT_ACTIONS, logAudit } from '@/lib/audit'
import { prisma } from '@/lib/db'
import { TEMPLATE_META } from '@/lib/mail/placeholders'
import { sanitizeBody } from '@/lib/mail/db-template'
import type { EmailTemplate } from '@/lib/mail/templates'

export const runtime = 'nodejs'

const upsertSchema = z.object({
  subject: z.string().min(1, 'Assunto não pode ser vazio').max(255),
  body: z.string().min(1, 'Corpo não pode ser vazio').max(50_000),
  enabled: z.boolean(),
})

function isKnownTemplate(key: string): key is EmailTemplate {
  return Object.prototype.hasOwnProperty.call(TEMPLATE_META, key)
}

// GET — Retorna o override + meta do template. Quando não existe override,
// retorna `override: null` (UI exibe placeholders pra começar do zero).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const requestId = randomUUID()

  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso negado.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const { key } = await params
    if (!isKnownTemplate(key)) {
      const res = NextResponse.json(
        { error: 'NOT_FOUND', message: 'Template desconhecido.', requestId },
        { status: 404 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const override = await prisma.emailTemplateOverride.findUnique({
      where: { key },
      include: {
        updatedBy: { select: { id: true, nome: true, email: true } },
      },
    })

    const meta = TEMPLATE_META[key]
    const res = NextResponse.json({
      data: {
        key,
        meta: {
          label: meta.label,
          description: meta.description,
          sensitive: meta.sensitive ?? false,
          placeholders: meta.placeholders,
        },
        override: override
          ? {
              subject: override.subject,
              body: override.body,
              enabled: override.enabled,
              updatedAt: override.updatedAt,
              updatedBy: override.updatedBy,
            }
          : null,
      },
      requestId,
    })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (err) {
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    const res = NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro interno.', requestId },
      { status: 500 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  }
}

// PUT — Upsert do override. Sanitiza o body antes de salvar.
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso negado.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const { key } = await params
    if (!isKnownTemplate(key)) {
      const res = NextResponse.json(
        { error: 'NOT_FOUND', message: 'Template desconhecido.', requestId },
        { status: 404 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const body = await req.json()
    const data = upsertSchema.parse(body)

    const sanitized = sanitizeBody(data.body)

    const existing = await prisma.emailTemplateOverride.findUnique({ where: { key } })

    const saved = await prisma.emailTemplateOverride.upsert({
      where: { key },
      create: {
        key,
        subject: data.subject,
        body: sanitized,
        enabled: data.enabled,
        updatedById: session.user.id,
      },
      update: {
        subject: data.subject,
        body: sanitized,
        enabled: data.enabled,
        updatedById: session.user.id,
      },
    })

    // Logs separados para mudança de conteúdo vs toggle de habilitação.
    const wasEnabled = existing?.enabled ?? false
    if (wasEnabled !== data.enabled) {
      await logAudit({
        userId: session.user.id,
        action: data.enabled
          ? AUDIT_ACTIONS.EMAIL_TEMPLATE_HABILITADO
          : AUDIT_ACTIONS.EMAIL_TEMPLATE_DESABILITADO,
        entity: 'EmailTemplateOverride',
        entityId: saved.id,
        details: { key, enabled: data.enabled },
        ip: req.headers.get('x-forwarded-for') ?? undefined,
      })
    }
    if (
      !existing ||
      existing.subject !== data.subject ||
      existing.body !== sanitized
    ) {
      await logAudit({
        userId: session.user.id,
        action: AUDIT_ACTIONS.EMAIL_TEMPLATE_ATUALIZADO,
        entity: 'EmailTemplateOverride',
        entityId: saved.id,
        details: { key, subjectLen: data.subject.length, bodyLen: sanitized.length },
        ip: req.headers.get('x-forwarded-for') ?? undefined,
      })
    }

    const res = NextResponse.json({
      message: 'Template salvo.',
      data: { id: saved.id, key: saved.key, enabled: saved.enabled, updatedAt: saved.updatedAt },
      requestId,
    })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'PUT',
      path: `/api/admin/email-templates/${key}`,
      status: 200,
      durationMs: Date.now() - start,
    })

    return res
  } catch (err) {
    if (err instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {}
      for (const e of err.errors) {
        fieldErrors[e.path.join('.')] = e.message
      }
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
}
