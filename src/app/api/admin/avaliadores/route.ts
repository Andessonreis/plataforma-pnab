import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

// ── GET — Listar avaliadores ativos com contagem de pendências ──────────────

export async function GET() {
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

    // Buscar avaliadores ativos
    const avaliadores = await prisma.user.findMany({
      where: { role: 'AVALIADOR', ativo: true },
      select: { id: true, nome: true, email: true },
      orderBy: { nome: 'asc' },
    })

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
