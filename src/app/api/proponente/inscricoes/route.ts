import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'
import { Prisma } from '@prisma/client'

export const runtime = 'nodejs'

const createSchema = z.object({
  editalId: z.string().min(1, 'editalId é obrigatório'),
  categoria: z.string().optional(),
})

const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
})

// ─── POST — Criar inscrição (rascunho) ──────────────────────────────────────

export async function POST(req: NextRequest) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const session = await auth()
    if (!session || session.user.role !== 'PROPONENTE') {
      const res = NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Acesso negado.', requestId },
        { status: 401 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const body = await req.json()
    const data = createSchema.parse(body)
    const userId = session.user.id

    // Verificar se edital existe e está com inscrições abertas
    const edital = await prisma.edital.findUnique({
      where: { id: data.editalId },
      select: { id: true, status: true, ano: true, categorias: true },
    })

    if (!edital) {
      const res = NextResponse.json(
        { error: 'NOT_FOUND', message: 'Edital não encontrado.', requestId },
        { status: 404 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    if (edital.status !== 'INSCRICOES_ABERTAS') {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'As inscrições para este edital não estão abertas.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // Verificar inscrição duplicada
    const existing = await prisma.inscricao.findFirst({
      where: { editalId: data.editalId, proponenteId: userId },
    })

    if (existing) {
      const res = NextResponse.json(
        { error: 'CONFLICT', message: 'Você já possui uma inscrição neste edital.', requestId, inscricaoId: existing.id },
        { status: 409 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // Validar categoria (se edital tem categorias, a categoria informada deve ser válida)
    if (data.categoria && edital.categorias.length > 0 && !edital.categorias.includes(data.categoria)) {
      const res = NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Categoria inválida para este edital.', requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // Gerar número sequencial: PNAB-{ano}-{sequencial 4 dígitos}
    // Conta globalmente por ano para evitar colisão entre editais do mesmo ano
    // Retry em caso de race condition no unique constraint
    let inscricao!: { id: string; numero: string }
    for (let attempt = 0; attempt < 3; attempt++) {
      const count = await prisma.inscricao.count({
        where: { numero: { startsWith: `PNAB-${edital.ano}-` } },
      })
      const numero = `PNAB-${edital.ano}-${String(count + 1 + attempt).padStart(4, '0')}`

      try {
        inscricao = await prisma.inscricao.create({
          data: {
            numero,
            editalId: data.editalId,
            proponenteId: userId,
            status: 'RASCUNHO',
            categoria: data.categoria ?? null,
            campos: {},
          },
          select: { id: true, numero: true },
        })
        break
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002' && attempt < 2) {
          continue
        }
        throw e
      }
    }

    await logAudit({
      userId,
      action: AUDIT_ACTIONS.INSCRICAO_CRIADA,
      entity: 'Inscricao',
      entityId: inscricao.id,
      details: { editalId: data.editalId, numero: inscricao.numero },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const res = NextResponse.json(
      { id: inscricao.id, numero: inscricao.numero, requestId },
      { status: 201 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({ requestId, method: 'POST', path: '/api/proponente/inscricoes', status: 201, durationMs: Date.now() - start })
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
      { error: 'INTERNAL_ERROR', message: 'Erro interno. Tente novamente.', requestId },
      { status: 500 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  }
}

// ─── GET — Listar inscrições do proponente ──────────────────────────────────

export async function GET(req: NextRequest) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const session = await auth()
    if (!session || session.user.role !== 'PROPONENTE') {
      const res = NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Acesso negado.', requestId },
        { status: 401 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const params = listSchema.parse(Object.fromEntries(new URL(req.url).searchParams))
    const { page, pageSize } = params
    const userId = session.user.id

    const where = { proponenteId: userId }
    const [data, total] = await Promise.all([
      prisma.inscricao.findMany({
        where,
        include: {
          edital: { select: { titulo: true, slug: true } },
          _count: { select: { anexos: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.inscricao.count({ where }),
    ])

    const res = NextResponse.json({
      data,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({ requestId, method: 'GET', path: '/api/proponente/inscricoes', status: 200, durationMs: Date.now() - start })
    return res
  } catch (err) {
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    const res = NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro interno. Tente novamente.', requestId },
      { status: 500 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  }
}
