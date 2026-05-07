import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'

export const runtime = 'nodejs'

const slideSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  descricao: z.string().nullable().optional(),
  imagemUrl: z.string().nullable().optional(),
  ctaLabel: z.string().nullable().optional(),
  ctaUrl: z.string().nullable().optional(),
  ordem: z.coerce.number().int().default(0),
  ativo: z.boolean().default(true),
  inicioEm: z.string().nullable().optional(),
  fimEm: z.string().nullable().optional(),
})

// ── PUT — Atualizar slide ───────────────────────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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

    const { id } = await params

    const existing = await prisma.slideDestaque.findUnique({ where: { id } })
    if (!existing) {
      const res = NextResponse.json(
        { error: 'NOT_FOUND', message: 'Slide não encontrado.', requestId },
        { status: 404 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const body = await req.json()
    const data = slideSchema.parse(body)

    const slide = await prisma.slideDestaque.update({
      where: { id },
      data: {
        titulo: data.titulo,
        descricao: data.descricao ?? null,
        imagemUrl: data.imagemUrl ?? null,
        ctaLabel: data.ctaLabel ?? null,
        ctaUrl: data.ctaUrl ?? null,
        ordem: data.ordem,
        ativo: data.ativo,
        inicioEm: data.inicioEm ? new Date(data.inicioEm) : null,
        fimEm: data.fimEm ? new Date(data.fimEm) : null,
      },
    })

    await logAudit({
      userId: session.user.id,
      action: 'SLIDE_ATUALIZADO',
      entity: 'SlideDestaque',
      entityId: slide.id,
      details: { titulo: slide.titulo, ativo: slide.ativo },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    // #63 — invalida cache da home para refletir alterações
    revalidatePath('/')

    const res = NextResponse.json(
      { message: 'Slide atualizado.', id: slide.id, requestId },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'PUT',
      path: `/api/admin/slides/${id}`,
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

// ── DELETE — Excluir slide ──────────────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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

    const { id } = await params

    const existing = await prisma.slideDestaque.findUnique({ where: { id } })
    if (!existing) {
      const res = NextResponse.json(
        { error: 'NOT_FOUND', message: 'Slide não encontrado.', requestId },
        { status: 404 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    await prisma.slideDestaque.delete({ where: { id } })

    await logAudit({
      userId: session.user.id,
      action: 'SLIDE_EXCLUIDO',
      entity: 'SlideDestaque',
      entityId: id,
      details: { titulo: existing.titulo },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    // #63 — invalida cache da home após remoção
    revalidatePath('/')

    const res = NextResponse.json(
      { message: 'Slide excluído com sucesso.', requestId },
      { status: 200 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'DELETE',
      path: `/api/admin/slides/${id}`,
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
