import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
  fase: z.string().optional(),
  pendente: z.string().optional(),
})

// GET — Listar recursos (paginado, filtrável)
export async function GET(req: NextRequest) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const session = await auth()
    if (!session || !['ADMIN', 'HABILITADOR'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso negado.', requestId },
        { status: 403 },
      )
    }

    const params = querySchema.parse(Object.fromEntries(new URL(req.url).searchParams))
    const { page, pageSize, fase, pendente } = params

    const where: Record<string, unknown> = {}
    if (fase) where.fase = fase
    if (pendente === 'true') where.decisao = null

    const [data, total] = await Promise.all([
      prisma.recurso.findMany({
        where,
        include: {
          inscricao: {
            include: {
              proponente: { select: { nome: true, cpfCnpj: true } },
              edital: { select: { titulo: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.recurso.count({ where }),
    ])

    const res = NextResponse.json({
      data,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      requestId,
    })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    console.log({ requestId, method: 'GET', path: '/api/admin/recursos', status: 200, durationMs: Date.now() - start })
    return res
  } catch (err) {
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro ao listar recursos.', requestId },
      { status: 500 },
    )
  }
}
