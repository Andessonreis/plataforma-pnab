import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { auth } from '@server/lib/auth'
import { prisma } from '@server/lib/db'

export const runtime = 'nodejs'

const querySchema = z.object({
  editalId: z.string().optional(),
})

// ── GET — Listar avaliadores ativos com contagem de pendências ──────────────

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

    let avaliadores: { id: string; nome: string; email: string }[]

    if (params.editalId) {
      // Se edital tem membros AVALIADOR → retorna só eles. Senão → todos (backwards compat).
      const membros = await prisma.editalMembro.findMany({
        where: { editalId: params.editalId, funcao: 'AVALIADOR' },
        include: { user: { select: { id: true, nome: true, email: true, ativo: true } } },
      })

      if (membros.length > 0) {
        avaliadores = membros
          .filter((m) => m.user.ativo)
          .map((m) => ({ id: m.user.id, nome: m.user.nome, email: m.user.email }))
      } else {
        avaliadores = await prisma.user.findMany({
          where: { role: 'AVALIADOR', ativo: true },
          select: { id: true, nome: true, email: true },
          orderBy: { nome: 'asc' },
        })
      }
    } else {
      avaliadores = await prisma.user.findMany({
        where: { role: 'AVALIADOR', ativo: true },
        select: { id: true, nome: true, email: true },
        orderBy: { nome: 'asc' },
      })
    }

    // Contagem de avaliações pendentes por avaliador
    const pendingCounts = await prisma.avaliacao.groupBy({
      by: ['avaliadorId'],
      where: { finalizada: false, avaliadorId: { in: avaliadores.map((a) => a.id) } },
      _count: { id: true },
    })

    const pendingMap = new Map(pendingCounts.map((p) => [p.avaliadorId, p._count.id]))

    const data = avaliadores.map((a) => ({
      id: a.id,
      nome: a.nome,
      email: a.email,
      pendingCount: pendingMap.get(a.id) ?? 0,
    }))

    const res = NextResponse.json({ data })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({ requestId, method: 'GET', path: '/api/admin/avaliadores', status: 200, durationMs: Date.now() - start })
    return res
  } catch (err) {
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro ao listar avaliadores', requestId },
      { status: 500, headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
    )
  }
}
