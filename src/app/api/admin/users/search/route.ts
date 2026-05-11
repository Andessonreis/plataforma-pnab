import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

const querySchema = z.object({
  q: z.string().trim().min(2).max(120).optional(),
  ids: z.string().trim().min(1).max(2000).optional(),
  role: z.enum(['PROPONENTE', 'ATENDIMENTO', 'HABILITADOR', 'AVALIADOR', 'ADMIN']).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
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

    if (!params.q && !params.ids) {
      const res = NextResponse.json({ data: [], requestId })
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const where: Record<string, unknown> = { ativo: true }
    if (params.role) where.role = params.role

    if (params.ids) {
      const ids = params.ids.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 50)
      where.id = { in: ids }
    } else if (params.q) {
      where.OR = [
        { nome: { contains: params.q, mode: 'insensitive' } },
        { email: { contains: params.q, mode: 'insensitive' } },
        { cpfCnpj: { contains: params.q.replace(/\D/g, '') } },
      ]
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { nome: 'asc' },
      take: params.limit,
      select: {
        id: true,
        nome: true,
        email: true,
        cpfCnpj: true,
        tipoProponente: true,
        role: true,
      },
    })

    const res = NextResponse.json({ data: users, requestId })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'GET',
      path: '/api/admin/users/search',
      status: 200,
      durationMs: Date.now() - start,
      count: users.length,
    })

    return res
  } catch (err) {
    if (err instanceof z.ZodError) {
      const res = NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Parâmetros inválidos.', requestId },
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
