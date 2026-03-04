import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { UserRole, TicketStatus } from '@prisma/client'

export const runtime = 'nodejs'

const ROLES_PERMITIDOS: UserRole[] = ['ADMIN', 'ATENDIMENTO']

const querySchema = z.object({
  page:   z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(15),
  status: z.enum(['ABERTO', 'EM_ATENDIMENTO', 'FECHADO']).optional(),
})

export async function GET(req: NextRequest) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const session = await auth()
    const role = session?.user?.role as UserRole | undefined

    if (!session || !role || !ROLES_PERMITIDOS.includes(role)) {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso negado.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const params = querySchema.parse(Object.fromEntries(new URL(req.url).searchParams))
    const { page, pageSize, status } = params

    const where = status ? { status: status as TicketStatus } : {}

    const [data, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          autor: { select: { nome: true, email: true } },
        },
      }),
      prisma.ticket.count({ where }),
    ])

    const res = NextResponse.json({
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({ requestId, method: 'GET', path: '/api/admin/tickets', status: 200, durationMs: Date.now() - start })
    return res

  } catch (err) {
    const res = NextResponse.json(
      { error: 'BAD_REQUEST', message: 'Parâmetros inválidos.', requestId },
      { status: 400 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    return res
  }
}
