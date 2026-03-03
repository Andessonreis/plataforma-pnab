import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  action: z.string().optional(),
  userId: z.string().optional(),
  entity: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
})

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

    const params = querySchema.parse(
      Object.fromEntries(new URL(req.url).searchParams),
    )
    const { page, pageSize, action, userId, entity, dateFrom, dateTo } = params

    // Monta filtros dinâmicos
    const where: Record<string, unknown> = {}
    if (action) where.action = action
    if (userId) where.userId = userId
    if (entity) where.entity = entity
    if (dateFrom || dateTo) {
      const createdAt: Record<string, Date> = {}
      if (dateFrom) createdAt.gte = new Date(dateFrom)
      if (dateTo) {
        const end = new Date(dateTo)
        end.setHours(23, 59, 59, 999)
        createdAt.lte = end
      }
      where.createdAt = createdAt
    }

    const [data, total, distinctActions, distinctEntities] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { id: true, nome: true, email: true, role: true } } },
      }),
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        distinct: ['action'],
        select: { action: true },
        orderBy: { action: 'asc' },
      }),
      prisma.auditLog.findMany({
        distinct: ['entity'],
        select: { entity: true },
        where: { entity: { not: null } },
        orderBy: { entity: 'asc' },
      }),
    ])

    const res = NextResponse.json({
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      filters: {
        actions: distinctActions.map((a) => a.action),
        entities: distinctEntities.map((e) => e.entity),
      },
      requestId,
    })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'GET',
      path: '/api/admin/logs',
      status: 200,
      durationMs: Date.now() - start,
    })

    return res
  } catch (err) {
    if (err instanceof z.ZodError) {
      const res = NextResponse.json(
        { error: 'VALIDATION_ERROR', message: err.errors[0].message, requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    console.error({
      requestId,
      error: err instanceof Error ? err.message : 'Unknown',
    })

    const res = NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro interno.', requestId },
      { status: 500 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  }
}
