import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'

export const runtime = 'nodejs'

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

    const url = new URL(req.url)
    const editalId = url.searchParams.get('editalId') || undefined
    const status = url.searchParams.get('status') || undefined

    const where: Record<string, unknown> = {}
    if (editalId) where.editalId = editalId
    if (status) where.status = status

    const inscricoes = await prisma.inscricao.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        edital: { select: { titulo: true } },
        proponente: { select: { nome: true, cpfCnpj: true, email: true } },
      },
    })

    // Gerar CSV
    const headers = ['Numero', 'Nome', 'CPF/CNPJ', 'Email', 'Edital', 'Status', 'Categoria', 'Nota Final', 'Enviada em']

    const rows = inscricoes.map((i) => [
      i.numero,
      `"${i.proponente.nome}"`,
      i.proponente.cpfCnpj ?? '',
      i.proponente.email,
      `"${i.edital.titulo}"`,
      i.status,
      i.categoria ?? '',
      i.notaFinal ? String(i.notaFinal) : '',
      i.submittedAt ? new Date(i.submittedAt).toLocaleDateString('pt-BR') : '',
    ])

    // BOM para UTF-8 + CSV
    const bom = '\uFEFF'
    const csv = bom + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n')

    await logAudit({
      userId: session.user.id,
      action: 'EXPORTACAO_CSV',
      entity: 'Inscricao',
      details: { totalRegistros: inscricoes.length, editalId: editalId ?? 'todos', status: status ?? 'todos' },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const datePart = new Date().toISOString().slice(0, 10)
    const statusPart = status ? `_${status.toLowerCase()}` : ''
    const filename = `inscricoes_pnab${statusPart}_${datePart}.csv`

    const res = new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Request-Id': requestId,
        'Cache-Control': 'no-store',
      },
    })

    console.log({
      requestId,
      method: 'GET',
      path: '/api/admin/inscricoes/export',
      status: 200,
      durationMs: Date.now() - start,
    })

    return res
  } catch (err) {
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })

    const res = NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro ao gerar CSV.', requestId },
      { status: 500 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  }
}
