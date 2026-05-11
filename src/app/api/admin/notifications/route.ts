import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { Prisma } from '@prisma/client'

export const runtime = 'nodejs'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  userId: z.string().optional(),
  campaignId: z.string().optional(),
  lida: z.enum(['true', 'false']).optional(),
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

    const params = querySchema.parse(Object.fromEntries(new URL(req.url).searchParams))
    const { page, pageSize, userId, campaignId, lida } = params

    const where: Prisma.NotificationWhereInput = {}
    if (userId) where.userId = userId
    if (campaignId) where.campaignId = campaignId
    if (lida === 'true') where.lidaEm = { not: null }
    if (lida === 'false') where.lidaEm = null

    const [data, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { id: true, nome: true, email: true } },
          campaign: { select: { id: true, titulo: true, tipo: true } },
        },
      }),
      prisma.notification.count({ where }),
    ])

    const res = NextResponse.json({
      data,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      requestId,
    })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'GET',
      path: '/api/admin/notifications',
      status: 200,
      durationMs: Date.now() - start,
    })

    return res
  } catch (err) {
    if (err instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {}
      for (const e of err.errors) fieldErrors[e.path.join('.')] = e.message
      const res = NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Parâmetros inválidos.', fieldErrors, requestId },
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
