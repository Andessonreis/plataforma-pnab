import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { auth } from '@server/lib/auth'
import { sendViaResend } from '@server/lib/mail/client'
import { renderOverride, sanitizeBody } from '@server/lib/mail/db-template'
import { renderTemplate } from '@server/lib/mail/render'
import { getSampleData, TEMPLATE_META } from '@shared/mail/placeholders'
import type { EmailTemplate } from '@shared/mail/templates'

export const runtime = 'nodejs'

const bodySchema = z.object({
  // Quando vier, usa esse subject/body em vez do que está salvo no DB. Útil
  // pra testar mudanças não salvas direto na UI.
  subject: z.string().min(1).max(255).optional(),
  body: z.string().min(1).max(50_000).optional(),
})

function isKnownTemplate(key: string): key is EmailTemplate {
  return Object.prototype.hasOwnProperty.call(TEMPLATE_META, key)
}

// POST — Envia o template renderizado pra session.user.email. Prefixa o
// assunto com [TESTE] pra deixar claro que não é um envio real.
export async function POST(
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

    const to = session.user.email
    if (!to) {
      const res = NextResponse.json(
        { error: 'NO_EMAIL', message: 'Sua conta não tem e-mail cadastrado.', requestId },
        { status: 400 },
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

    const json = await req.json().catch(() => ({}))
    const parsed = bodySchema.parse(json)
    const sample = getSampleData(key)

    let subject: string
    let html: string
    let text: string

    if (parsed.subject && parsed.body) {
      // Testa mudanças ainda não salvas — sanitiza igual ao PUT.
      const rendered = await renderOverride(
        { subject: parsed.subject, body: sanitizeBody(parsed.body) },
        sample,
      )
      subject = rendered.subject
      html = rendered.html
      text = rendered.text
    } else {
      // Testa o estado atual (override salvo se houver, senão componente padrão).
      const rendered = await renderTemplate(key, sample)
      subject = rendered.subject
      html = rendered.html
      text = rendered.text
    }

    // Envia ignorando a allowlist — é envio admin pra ele mesmo, sempre permitido.
    const result = await sendViaResend({
      to,
      subject: `[TESTE] ${subject}`,
      html,
      text: `[ENVIO DE TESTE — admin]\n\n${text}`,
    })

    console.log({
      requestId,
      method: 'POST',
      path: `/api/admin/email-templates/${key}/test-send`,
      status: 200,
      to,
      durationMs: Date.now() - start,
    })

    const res = NextResponse.json({
      message: `E-mail de teste enviado para ${to}.`,
      data: { id: result.id, to },
      requestId,
    })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (err) {
    if (err instanceof z.ZodError) {
      const res = NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Dados inválidos.', requestId },
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
