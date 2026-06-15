import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { auth } from '@server/lib/auth'
import { prisma } from '@server/lib/db'
import { logAudit } from '@server/lib/audit'
import { generateRelatorioFinal } from '@server/lib/pdf/relatorio-final'
import type { EditalStatus } from '@prisma/client'

export const runtime = 'nodejs'

/** Fases em que o relatório final pode ser gerado. */
const ALLOWED_STATUSES: EditalStatus[] = ['RESULTADO_FINAL', 'ENCERRADO']

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, context: RouteContext) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    // Auth — somente ADMIN
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Não autenticado.', requestId },
        { status: 401, headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
      )
    }
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso negado.', requestId },
        { status: 403, headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
      )
    }

    const { id: editalId } = await context.params

    // Buscar edital
    const edital = await prisma.edital.findUnique({
      where: { id: editalId },
      select: { id: true, titulo: true, ano: true, slug: true, status: true, valorTotal: true },
    })
    if (!edital) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Edital não encontrado.', requestId },
        { status: 404, headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
      )
    }

    // Validar fase do edital
    if (!ALLOWED_STATUSES.includes(edital.status as EditalStatus)) {
      return NextResponse.json(
        {
          error: 'BAD_REQUEST',
          message: `Relatório final disponível apenas para editais em fase RESULTADO_FINAL ou ENCERRADO. Status atual: ${edital.status}`,
          requestId,
        },
        { status: 400, headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
      )
    }

    // Buscar inscrições por status final (sem cumulativo — cada grupo separado)
    const [contemplados, suplentes, naoContemplados] = await Promise.all([
      prisma.inscricao.findMany({
        where: { editalId, status: 'CONTEMPLADA' },
        orderBy: [{ notaFinal: 'desc' }, { numero: 'asc' }],
        include: { proponente: { select: { nome: true, cpfCnpj: true } } },
      }),
      prisma.inscricao.findMany({
        where: { editalId, status: 'SUPLENTE' },
        orderBy: [{ notaFinal: 'desc' }, { numero: 'asc' }],
        include: { proponente: { select: { nome: true, cpfCnpj: true } } },
      }),
      prisma.inscricao.findMany({
        where: { editalId, status: 'NAO_CONTEMPLADA' },
        orderBy: [{ notaFinal: 'desc' }, { numero: 'asc' }],
        include: { proponente: { select: { nome: true, cpfCnpj: true } } },
      }),
    ])

    const mapItems = (items: typeof contemplados) =>
      items.map((insc, i) => ({
        posicao: i + 1,
        numero: insc.numero,
        nome: insc.proponente.nome,
        cpfCnpj: insc.proponente.cpfCnpj ?? '',
        categoria: insc.categoria,
        notaFinal: insc.notaFinal ? Number(insc.notaFinal) : null,
      }))

    const totalAvaliados = contemplados.length + suplentes.length + naoContemplados.length

    const buffer = await generateRelatorioFinal({
      edital: {
        titulo: edital.titulo,
        ano: edital.ano,
        slug: edital.slug,
        valorTotal: edital.valorTotal ? Number(edital.valorTotal) : null,
      },
      contemplados: mapItems(contemplados),
      suplentes: mapItems(suplentes),
      naoContemplados: mapItems(naoContemplados),
      totalAvaliados,
    })

    // Audit
    await logAudit({
      userId: session.user.id,
      action: 'EXPORTACAO_RELATORIO_FINAL',
      entity: 'Edital',
      entityId: editalId,
      details: {
        slug: edital.slug,
        contemplados: contemplados.length,
        suplentes: suplentes.length,
        naoContemplados: naoContemplados.length,
        totalAvaliados,
      },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const datePart = new Date().toISOString().slice(0, 10)
    const filename = `relatorio_final_${edital.slug}_${datePart}.pdf`

    console.log({
      requestId,
      method: 'GET',
      path: `/api/admin/editais/${editalId}/relatorio-final`,
      status: 200,
      durationMs: Date.now() - start,
    })

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Request-Id': requestId,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro ao gerar relatório final.', requestId },
      { status: 500, headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
    )
  }
}
