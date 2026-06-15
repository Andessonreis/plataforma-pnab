import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { auth } from '@server/lib/auth'
import { prisma } from '@server/lib/db'
import { TEMPLATE_META } from '@shared/mail/placeholders'
import type { EmailTemplate } from '@shared/mail/templates'

export const runtime = 'nodejs'

// GET — Lista todos os templates conhecidos (do código) + estado de override no banco.
export async function GET() {
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

    const overrides = await prisma.emailTemplateOverride.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        updatedBy: { select: { id: true, nome: true, email: true } },
      },
    })
    const byKey = new Map(overrides.map((o) => [o.key, o]))

    const items = (Object.keys(TEMPLATE_META) as EmailTemplate[]).map((key) => {
      const meta = TEMPLATE_META[key]
      const override = byKey.get(key)
      return {
        key,
        label: meta.label,
        description: meta.description,
        sensitive: meta.sensitive ?? false,
        override: override
          ? {
              enabled: override.enabled,
              updatedAt: override.updatedAt,
              updatedBy: override.updatedBy,
            }
          : null,
      }
    })

    const res = NextResponse.json({ data: items, requestId })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'GET',
      path: '/api/admin/email-templates',
      status: 200,
      durationMs: Date.now() - start,
    })

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
