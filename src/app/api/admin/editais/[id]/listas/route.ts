import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { generateListaInscricoes } from '@/lib/pdf/lista-inscricoes'
import { inscricaoStatusLabel, cumulativeStatuses } from '@/lib/status-maps'
import { categoriaWhere } from '@/lib/inscricoes/area-filter'
import type { InscricaoStatus } from '@prisma/client'

export const runtime = 'nodejs'

const VALID_STATUSES: InscricaoStatus[] = [
  'RASCUNHO',
  'ENVIADA',
  'HABILITADA',
  'INABILITADA',
  'EM_AVALIACAO',
  'RESULTADO_PRELIMINAR',
  'RECURSO_ABERTO',
  'RESULTADO_FINAL',
  'CONTEMPLADA',
  'NAO_CONTEMPLADA',
  'SUPLENTE',
]

const querySchema = z.object({
  status: z.enum(VALID_STATUSES as [InscricaoStatus, ...InscricaoStatus[]]),
  categoria: z.string().min(1).optional(),
})

/** Status com classificação por nota (ordena por notaFinal DESC). */
const STATUS_COM_NOTA = new Set<string>(['CONTEMPLADA', 'NAO_CONTEMPLADA', 'SUPLENTE'])

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

    // Validação de params
    const { id: editalId } = await context.params
    const url = new URL(req.url)
    const parsed = querySchema.safeParse({
      status: url.searchParams.get('status'),
      categoria: url.searchParams.get('categoria') ?? undefined,
    })
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Parâmetro "status" obrigatório e deve ser um status válido.', requestId },
        { status: 400, headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
      )
    }

    const { status, categoria } = parsed.data
    const recorteArea = categoriaWhere(categoria)

    // Buscar edital
    const edital = await prisma.edital.findUnique({
      where: { id: editalId },
      select: { id: true, titulo: true, ano: true, slug: true },
    })
    if (!edital) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Edital não encontrado.', requestId },
        { status: 404, headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
      )
    }

    // Buscar inscrições cumulativas (ex: "Habilitados" inclui todos que avançaram além da habilitação)
    const statusFilter = cumulativeStatuses[status]
    const hasNota = statusFilter.some((s) => STATUS_COM_NOTA.has(s))
    const orderBy = hasNota
      ? [{ notaFinal: 'desc' as const }, { numero: 'asc' as const }]
      : [{ numero: 'asc' as const }]

    const inscricoes = await prisma.inscricao.findMany({
      where: {
        editalId,
        status: { in: statusFilter },
        ...(recorteArea !== undefined ? { categoria: recorteArea } : {}),
      },
      orderBy,
      include: {
        proponente: { select: { nome: true, cpfCnpj: true, telefone: true } },
      },
    })

    // Montar dados para o PDF
    const statusLabel = inscricaoStatusLabel[status] ?? status
    const items = inscricoes.map((insc, i) => ({
      posicao: i + 1,
      numero: insc.numero,
      nome: insc.proponente.nome,
      cpfCnpj: insc.proponente.cpfCnpj ?? '',
      categoria: insc.categoria,
      telefone: insc.proponente.telefone,
      notaFinal: insc.notaFinal ? Number(insc.notaFinal) : null,
      motivoInabilitacao: insc.motivoInabilitacao,
    }))

    const buffer = await generateListaInscricoes({
      edital: { titulo: edital.titulo, ano: edital.ano },
      status,
      statusLabel,
      inscricoes: items,
      total: items.length,
    })

    // Audit
    await logAudit({
      userId: session.user.id,
      action: 'EXPORTACAO_LISTA_PDF',
      entity: 'Edital',
      entityId: editalId,
      details: { status, total: items.length, slug: edital.slug, categoria: categoria ?? 'todas' },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const datePart = new Date().toISOString().slice(0, 10)
    const filename = `lista_${status.toLowerCase()}_${edital.slug}_${datePart}.pdf`

    console.log({
      requestId,
      method: 'GET',
      path: `/api/admin/editais/${editalId}/listas`,
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
      { error: 'INTERNAL_ERROR', message: 'Erro ao gerar PDF da lista.', requestId },
      { status: 500, headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
    )
  }
}
