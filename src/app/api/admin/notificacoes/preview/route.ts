import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { auth } from '@server/lib/auth'
import { renderTemplate } from '@/lib/mail/render'

export const runtime = 'nodejs'

const previewSchema = z.object({
  titulo: z.string().max(500).optional(),
  assunto: z.string().max(500).optional(),
  corpo: z.string().max(50_000).optional(),
  link: z.string().max(2000).optional(),
  ctaLabel: z.string().max(200).optional(),
})

// POST — Renderiza a notificação que está sendo editada como e-mail (usa o
// template `notificacao_generica`). Preenche valores ausentes com placeholders
// pra mostrar o layout mesmo enquanto a admin ainda digita.
export async function POST(req: NextRequest) {
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

    const json = await req.json().catch(() => ({}))
    const parsed = previewSchema.parse(json)

    const titulo = parsed.titulo?.trim() || 'Título da notificação'
    const corpo =
      parsed.corpo?.trim() ||
      '<p style="color:#94a3b8">O corpo da mensagem aparece aqui conforme você digita.</p>'

    const { html } = await renderTemplate('notificacao_generica', {
      titulo,
      corpo,
      nome: 'Ana (exemplo)',
      link: parsed.link?.trim() || undefined,
      ctaLabel: parsed.ctaLabel?.trim() || undefined,
    })

    const res = NextResponse.json({
      data: {
        emailHtml: html,
        // Snapshot dos campos pra o client renderizar o card in-app.
        inApp: {
          titulo,
          corpo: parsed.corpo?.trim() || '',
          link: parsed.link?.trim() || null,
          ctaLabel: parsed.ctaLabel?.trim() || null,
        },
      },
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
