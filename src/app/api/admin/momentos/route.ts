import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'

export const runtime = 'nodejs'

// ── Schema de validação ─────────────────────────────────────────────────────

const momentoSchema = z.object({
  categoria: z.string().min(2, 'Categoria deve ter no mínimo 2 caracteres'),
  imagemUrl: z.string().min(1, 'Imagem é obrigatória'),
  instagramUrl: z.string().url('Informe uma URL válida do Instagram'),
  ordem: z.coerce.number().int().default(0),
  ativo: z.boolean().default(true),
})

// ── GET — Listar momentos ────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
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

    const momentos = await prisma.momentoSecretaria.findMany({
      orderBy: { ordem: 'asc' },
    })

    const res = NextResponse.json({ data: momentos, requestId })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'GET',
      path: '/api/admin/momentos',
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

// ── POST — Criar momento ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
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

    const body = await req.json()
    const data = momentoSchema.parse(body)

    const momento = await prisma.momentoSecretaria.create({
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
      action: 'MOMENTO_CRIADO',
      entity: 'MomentoSecretaria',
      entityId: momento.id,
      details: { categoria: momento.categoria, ativo: momento.ativo },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    // Invalida o cache da home pro momento aparecer imediatamente
    revalidatePath('/')

    const res = NextResponse.json(
      { message: 'Momento criado com sucesso.', id: momento.id, requestId },
      { status: 201 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'POST',
      path: '/api/admin/momentos',
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
