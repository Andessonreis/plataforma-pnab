import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { calculateResults, saveResults } from '@/lib/results/calculate'
import { enqueueEmail } from '@/lib/queue'

export const runtime = 'nodejs'

const publishSchema = z.object({
  fase: z.enum(['RESULTADO_PRELIMINAR', 'RESULTADO_FINAL']),
})

// GET — Consultar resultados de um edital
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso negado.', requestId },
        { status: 403 },
      )
    }

    const { id } = await params

    const edital = await prisma.edital.findUnique({
      where: { id },
      select: { id: true, titulo: true, status: true },
    })

    if (!edital) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Edital não encontrado.', requestId },
        { status: 404 },
      )
    }

    // Busca inscrições com notas
    const inscricoes = await prisma.inscricao.findMany({
      where: { editalId: id },
      include: {
        proponente: { select: { nome: true, cpfCnpj: true } },
        avaliacoes: {
          where: { finalizada: true },
          select: { notaTotal: true, avaliadorId: true },
        },
      },
      orderBy: { notaFinal: 'desc' },
    })

    const resultados = inscricoes
      .filter((i) => !['RASCUNHO', 'ENVIADA'].includes(i.status))
      .map((i, index) => ({
        posicao: index + 1,
        inscricaoId: i.id,
        numero: i.numero,
        proponenteNome: i.proponente.nome,
        categoria: i.categoria,
        notaFinal: i.notaFinal ? Number(i.notaFinal) : null,
        status: i.status,
        totalAvaliacoes: i.avaliacoes.length,
      }))

    const res = NextResponse.json({
      edital: { id: edital.id, titulo: edital.titulo, status: edital.status },
      resultados,
      requestId,
    })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    console.log({ requestId, method: 'GET', path: `/api/admin/editais/${id}/resultados`, status: 200, durationMs: Date.now() - start })
    return res
  } catch (err) {
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro ao consultar resultados.', requestId },
      { status: 500 },
    )
  }
}

// POST — Calcular e publicar resultados
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso negado.', requestId },
        { status: 403 },
      )
    }

    const { id } = await params
    const body = await req.json()
    const { fase } = publishSchema.parse(body)

    const edital = await prisma.edital.findUnique({
      where: { id },
      select: { id: true, titulo: true, slug: true, status: true },
    })

    if (!edital) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Edital não encontrado.', requestId },
        { status: 404 },
      )
    }

    // Calcula notas finais
    const resultados = await calculateResults(id)

    if (resultados.length === 0) {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Nenhuma inscrição avaliada encontrada.', requestId },
        { status: 400 },
      )
    }

    // Salva notas e atualiza status das inscrições
    await saveResults(resultados, fase)

    // Atualiza status do edital
    const editalStatus = fase === 'RESULTADO_FINAL' ? 'RESULTADO_FINAL' : 'RESULTADO_PRELIMINAR'
    await prisma.edital.update({
      where: { id },
      data: { status: editalStatus },
    })

    // Notifica proponentes por e-mail
    const inscricoes = await prisma.inscricao.findMany({
      where: { id: { in: resultados.map((r) => r.inscricaoId) } },
      include: { proponente: { select: { email: true, nome: true } } },
    })

    const template = fase === 'RESULTADO_FINAL' ? 'resultado_final' : 'resultado_preliminar'
    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

    for (const inscricao of inscricoes) {
      await enqueueEmail({
        to: inscricao.proponente.email,
        subject: `${fase === 'RESULTADO_FINAL' ? 'Resultado Final' : 'Resultado Preliminar'} — ${edital.titulo}`,
        template,
        data: {
          edital: edital.titulo,
          url: `${baseUrl}/editais/${edital.slug}/resultados`,
        },
      })
    }

    // Audit
    const auditAction = fase === 'RESULTADO_FINAL'
      ? 'RESULTADO_FINAL_PUBLICADO'
      : 'RESULTADO_PRELIMINAR_PUBLICADO'

    await logAudit({
      userId: session.user.id,
      action: auditAction,
      entity: 'Edital',
      entityId: id,
      details: { fase, totalInscrições: resultados.length },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const res = NextResponse.json({
      message: `${fase === 'RESULTADO_FINAL' ? 'Resultado final' : 'Resultado preliminar'} publicado com sucesso.`,
      totalInscrições: resultados.length,
      requestId,
    })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    console.log({ requestId, method: 'POST', path: `/api/admin/editais/${id}/resultados`, status: 200, durationMs: Date.now() - start })
    return res
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Fase inválida.', requestId },
        { status: 400 },
      )
    }
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro ao publicar resultados.', requestId },
      { status: 500 },
    )
  }
}
