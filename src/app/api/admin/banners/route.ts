import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { auth } from '@server/lib/auth'
import { prisma } from '@server/lib/db'
import { logAudit } from '@server/lib/audit'

export const runtime = 'nodejs'

// ── Schema de validação ─────────────────────────────────────────────────────

const bannerSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  texto: z.string().min(3, 'Texto deve ter no mínimo 3 caracteres'),
  ctaLabel: z.string().nullable().optional(),
  ctaUrl: z.string().nullable().optional(),
  ativo: z.boolean().default(true),
  inicioEm: z.string().min(1, 'Data de início é obrigatória'),
  fimEm: z.string().min(1, 'Data de fim é obrigatória'),
}).refine(
  (data) => new Date(data.fimEm) > new Date(data.inicioEm),
  { message: 'Data de fim deve ser posterior à data de início', path: ['fimEm'] },
)

// ── GET — Listar banners ────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
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

    const banners = await prisma.banner.findMany({
      orderBy: { createdAt: 'desc' },
    })

    const res = NextResponse.json({ data: banners, requestId })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'GET',
      path: '/api/admin/banners',
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

// ── POST — Criar banner ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
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

    const body = await req.json()
    const data = bannerSchema.parse(body)

    const banner = await prisma.banner.create({
      data: {
        titulo: data.titulo,
        texto: data.texto,
        ctaLabel: data.ctaLabel ?? null,
        ctaUrl: data.ctaUrl ?? null,
        ativo: data.ativo,
        inicioEm: new Date(data.inicioEm),
        fimEm: new Date(data.fimEm),
      },
    })

    await logAudit({
      userId: session.user.id,
      action: 'BANNER_CRIADO',
      entity: 'Banner',
      entityId: banner.id,
      details: { titulo: banner.titulo, ativo: banner.ativo },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    // ActiveBanners é renderizado no layout público — invalida todo o subtree.
    revalidatePath('/', 'layout')

    const res = NextResponse.json(
      { message: 'Banner criado com sucesso.', id: banner.id, requestId },
      { status: 201 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'POST',
      path: '/api/admin/banners',
      status: 201,
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
