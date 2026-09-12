import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'

export const runtime = 'nodejs'

const momentoSchema = z.object({
  categoria: z.string().min(2, 'Categoria deve ter no mínimo 2 caracteres'),
  imagemUrl: z.string().min(1, 'Imagem é obrigatória'),
  instagramUrl: z.string().url('Informe uma URL válida do Instagram'),
  ordem: z.coerce.number().int().default(0),
  ativo: z.boolean().default(true),
})

// ── PUT — Atualizar momento ──────────────────────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const session = await auth()
    if (!session || !['SUPER_ADMIN', 'COMUNICACAO'].includes(session.user.role)) {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso negado.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const { id } = await params

    const existing = await prisma.momentoSecretaria.findUnique({ where: { id } })
    if (!existing) {
      const res = NextResponse.json(
        { error: 'NOT_FOUND', message: 'Momento não encontrado.', requestId },
        { status: 404 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const body = await req.json()
    const data = momentoSchema.parse(body)

    const momento = await prisma.momentoSecretaria.update({
      where: { id },
      data: {
        categoria: data.categoria,
        imagemUrl: data.imagemUrl,
        instagramUrl: data.instagramUrl,
        ordem: data.ordem,
        ativo: data.ativo,
      },
    })

    await logAudit({
      userId: session.user.id,
      action: 'MOMENTO_ATUALIZADO',
      entity: 'MomentoSecretaria',
      entityId: momento.id,
      details: { categoria: momento.categoria, ativo: momento.ativo },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    revalidatePath('/')

    const res = NextResponse.json({ message: 'Momento atualizado.', id: momento.id, requestId })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'PUT',
      path: `/api/admin/momentos/${id}`,
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

// ── DELETE — Excluir momento ─────────────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const session = await auth()
    if (!session || !['SUPER_ADMIN', 'COMUNICACAO'].includes(session.user.role)) {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso negado.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const { id } = await params

    const existing = await prisma.momentoSecretaria.findUnique({ where: { id } })
    if (!existing) {
      const res = NextResponse.json(
        { error: 'NOT_FOUND', message: 'Momento não encontrado.', requestId },
        { status: 404 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    await prisma.momentoSecretaria.delete({ where: { id } })

    await logAudit({
      userId: session.user.id,
      action: 'MOMENTO_EXCLUIDO',
      entity: 'MomentoSecretaria',
      entityId: id,
      details: { categoria: existing.categoria },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    revalidatePath('/')

    const res = NextResponse.json({ message: 'Momento excluído com sucesso.', requestId }, { status: 200 })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'DELETE',
      path: `/api/admin/momentos/${id}`,
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
