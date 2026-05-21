import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { auth } from '@server/lib/auth'
import { prisma } from '@server/lib/db'

export const runtime = 'nodejs'

const querySchema = z.object({
  editalId: z.string().optional(),
})

// ── GET — Listar habilitadores ativos (com filtro opcional por edital) ────────

export async function GET(req: NextRequest) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso restrito a administradores', requestId },
        { status: 403, headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
      )
    }

    const params = querySchema.parse(
      Object.fromEntries(new URL(req.url).searchParams),
    )

    let habilitadores

    if (params.editalId) {
      // Se edital tem membros HABILITADOR → retorna só eles. Senão → todos.
      const membros = await prisma.editalMembro.findMany({
        where: { editalId: params.editalId, funcao: 'HABILITADOR' },
        include: { user: { select: { id: true, nome: true, email: true, ativo: true } } },
      })

      if (membros.length > 0) {
        habilitadores = membros
          .filter((m) => m.user.ativo)
          .map((m) => ({ id: m.user.id, nome: m.user.nome, email: m.user.email }))
      } else {
        habilitadores = await prisma.user.findMany({
          where: { role: 'HABILITADOR', ativo: true },
          select: { id: true, nome: true, email: true },
          orderBy: { nome: 'asc' },
        })
      }
    } else {
      habilitadores = await prisma.user.findMany({
        where: { role: 'HABILITADOR', ativo: true },
        select: { id: true, nome: true, email: true },
        orderBy: { nome: 'asc' },
      })
    }

    const res = NextResponse.json({ data: habilitadores })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({ requestId, method: 'GET', path: '/api/admin/habilitadores', status: 200, durationMs: Date.now() - start })
    return res
  } catch (err) {
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro ao listar habilitadores', requestId },
      { status: 500, headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
    )
  }
}
