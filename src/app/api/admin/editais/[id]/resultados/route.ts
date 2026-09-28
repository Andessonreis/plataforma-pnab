import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { calculateResults, saveResults } from '@/lib/results/calculate'
import { avisarProponentesDoResultado } from '@/lib/results/avisar-resultado'
import { viewNotaFinal } from '@/lib/services/resultado-view'
import { publicarResultadoPreliminar } from '@/lib/services/publicar-preliminar.service'
import { ServiceError } from '@/lib/services/errors'

export const runtime = 'nodejs'

const publishSchema = z.object({
  fase: z.enum(['RESULTADO_PRELIMINAR', 'RESULTADO_FINAL']),
  // Só vale para o preliminar, que por padrão não avisa ninguém; o resultado final sempre avisa.
  avisarPorEmail: z.boolean().default(false),
})

function respostaDaPublicacao(
  requestId: string, start: number, editalId: string,
  corpo: { message: string; totalInscrições: number; hasEmpates: boolean; avisos?: string[] },
) {
  const res = NextResponse.json({ ...corpo, requestId })
  res.headers.set('X-Request-Id', requestId)
  res.headers.set('Cache-Control', 'no-store')
  console.log({ requestId, method: 'POST', path: `/api/admin/editais/${editalId}/resultados`, status: 200, durationMs: Date.now() - start })
  return res
}

// GET — Consultar resultados de um edital
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const session = await auth()
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso negado.', requestId },
        { status: 403 },
      )
    }

    const { id } = await params

    const edital = await prisma.edital.findUnique({
      where: { id },
      select: { id: true, titulo: true, status: true, bonusVisivelParaAdmin: true },
    })

    if (!edital) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Edital não encontrado.', requestId },
        { status: 404 },
      )
    }

    // Busca inscrições com notas — ordenadas por posicao (manual) e notaFinal
    const inscricoes = await prisma.inscricao.findMany({
      where: { editalId: id },
      include: {
        proponente: { select: { nome: true, cpfCnpj: true } },
        avaliacoes: {
          where: { finalizada: true },
          select: { notaTotal: true, avaliadorId: true },
        },
      },
      orderBy: [
        { posicao: { sort: 'asc', nulls: 'last' } },
        { notaFinal: { sort: 'desc', nulls: 'last' } },
      ],
    })

    const filtered = inscricoes.filter((i) => !['RASCUNHO', 'ENVIADA'].includes(i.status))

    // Detecta empates
    const notaGroups = new Map<number, number>()
    for (const i of filtered) {
      if (i.notaFinal != null) {
        const nota = Number(i.notaFinal)
        notaGroups.set(nota, (notaGroups.get(nota) ?? 0) + 1)
      }
    }
    const hasEmpates = Array.from(notaGroups.values()).some(count => count > 1)

    const resultados = filtered.map((i, index) => ({
      posicao: i.posicao ?? index + 1,
      inscricaoId: i.id,
      numero: i.numero,
      proponenteNome: i.proponente.nome,
      categoria: i.categoria,
      notaFinal: viewNotaFinal(i, session.user.role, edital.bonusVisivelParaAdmin),
      status: i.status,
      totalAvaliacoes: i.avaliacoes.length,
    }))

    const res = NextResponse.json({
      edital: { id: edital.id, titulo: edital.titulo, status: edital.status },
      resultados,
      hasEmpates,
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
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso negado.', requestId },
        { status: 403 },
      )
    }

    const { id } = await params
    const body = await req.json()
    const { fase, avisarPorEmail } = publishSchema.parse(body)
    const ip = req.headers.get('x-forwarded-for') ?? undefined

    // O preliminar grava a classificação (classificados, suplentes e desclassificados) e congela a lista.
    if (fase === 'RESULTADO_PRELIMINAR') {
      const publicado = await publicarResultadoPreliminar({ editalId: id, userId: session.user.id, ip, avisarPorEmail })
      return respostaDaPublicacao(requestId, start, id, {
        message: 'Resultado preliminar publicado com sucesso.',
        totalInscrições: publicado.total,
        hasEmpates: publicado.hasEmpates,
        avisos: publicado.avisos,
      })
    }

    const edital = await prisma.edital.findUnique({
      where: { id },
      select: { id: true, titulo: true, slug: true, status: true, vagasContemplados: true, vagasSuplentes: true, notaMinima: true, categoriasConfig: true },
    })

    if (!edital) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Edital não encontrado.', requestId },
        { status: 404 },
      )
    }

    // Calcula notas finais (sem desempate automático — desempate é manual).
    // incluirBonus: true — a publicação é o ato oficial, o bônus de cota tem
    // que valer pra ranking/classificação real a partir daqui.
    const resultados = await calculateResults(id, { incluirBonus: true })

    if (resultados.length === 0) {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Nenhuma inscrição avaliada encontrada.', requestId },
        { status: 400 },
      )
    }

    // Salva notas e atualiza status das inscrições
    await saveResults(resultados, 'RESULTADO_FINAL', {
      contemplados: edital.vagasContemplados,
      suplentes: edital.vagasSuplentes,
      notaMinima: edital.notaMinima ? Number(edital.notaMinima) : null,
      categoriasConfig: Array.isArray(edital.categoriasConfig)
        ? (edital.categoriasConfig as unknown as import('@/types/categoria-config').CategoriaConfig[])
        : null,
    })

    await prisma.edital.update({
      where: { id },
      data: { status: 'RESULTADO_FINAL' },
    })

    await avisarProponentesDoResultado({
      inscricaoIds: resultados.map((r) => r.inscricaoId), editalTitulo: edital.titulo, slug: edital.slug, final: true,
    })

    await logAudit({
      userId: session.user.id,
      action: 'RESULTADO_FINAL_PUBLICADO',
      entity: 'Edital',
      entityId: id,
      details: { fase, totalInscrições: resultados.length },
      ip,
    })

    return respostaDaPublicacao(requestId, start, id, {
      message: 'Resultado final publicado com sucesso.',
      totalInscrições: resultados.length,
      hasEmpates: resultados.some((r) => r.empatados && r.empatados.length > 0),
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Fase inválida.', requestId },
        { status: 400 },
      )
    }
    if (err instanceof ServiceError) {
      return NextResponse.json(
        { error: err.code, message: err.message, requestId },
        { status: err.httpStatus },
      )
    }
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro ao publicar resultados.', requestId },
      { status: 500 },
    )
  }
}
