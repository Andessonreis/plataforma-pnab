import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { renderOverride, sanitizeBody } from '@/lib/mail/db-template'
import { renderTemplate } from '@/lib/mail/render'
import { getSampleData, TEMPLATE_META } from '@/lib/mail/placeholders'
import type { EmailTemplate } from '@/lib/mail/templates'

export const runtime = 'nodejs'

const previewSchema = z.object({
  subject: z.string().min(1).max(255).optional(),
  body: z.string().min(1).max(50_000).optional(),
})

function isKnownTemplate(key: string): key is EmailTemplate {
  return Object.prototype.hasOwnProperty.call(TEMPLATE_META, key)
}

// POST — Renderiza o template com dados de exemplo, devolvendo subject+html
// pra UI mostrar em iframe. Se vier subject/body no body, usa eles (preview
// de mudanças ainda não salvas); senão usa o componente React Email (default).
export async function POST(
  req: NextRequest,
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

    const json = await req.json().catch(() => ({}))
    const parsed = previewSchema.parse(json)
    const sample = getSampleData(key)

    let rendered: { subject: string; html: string }
    if (parsed.subject && parsed.body) {
      // Preview "ao vivo" das mudanças (não salvas) — sanitiza igual ao PUT.
      rendered = await renderOverride(
        { subject: parsed.subject, body: sanitizeBody(parsed.body) },
        sample,
      )
    } else {
      // Preview do default (componente React Email).
      const r = await renderTemplate(key, sample)
      rendered = { subject: r.subject, html: r.html }
    }

    const res = NextResponse.json({
      data: { subject: rendered.subject, html: rendered.html, sample },
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
