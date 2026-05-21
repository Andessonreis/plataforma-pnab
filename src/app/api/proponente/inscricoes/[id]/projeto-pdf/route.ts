import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { auth } from '@server/lib/auth'
import { prisma } from '@server/lib/db'
import { generateProjetoCompleto } from '@/lib/pdf/projeto-completo'

export const runtime = 'nodejs'

/** Prisma Json pode retornar string em vez de objeto — parsear com segurança */
function parseCampos(raw: unknown): Record<string, unknown> {
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) } catch { return {} }
  }
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>
  }
  return {}
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Não autenticado.', requestId },
        { status: 401 },
      )
    }

    const { id } = await params

    const inscricao = await prisma.inscricao.findUnique({
      where: { id },
      include: {
        proponente: {
          select: { id: true, nome: true, cpfCnpj: true, email: true, tipoProponente: true },
        },
        edital: {
          select: { titulo: true, ano: true, camposFormulario: true },
        },
        anexos: {
          select: { titulo: true, tipo: true, valido: true },
        },
      },
    })

    if (!inscricao) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Inscrição não encontrada.', requestId },
        { status: 404 },
      )
    }

    // Apenas o proponente dono ou ADMIN pode baixar
    const isOwner = inscricao.proponente.id === session.user.id
    const isAdmin = session.user.role === 'ADMIN'
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso negado.', requestId },
        { status: 403 },
      )
    }

    // Só gera PDF para inscrições já enviadas
    if (inscricao.status === 'RASCUNHO') {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'PDF disponível apenas para inscrições enviadas.', requestId },
        { status: 400 },
      )
    }

    // Parsear camposFormulario do edital (Json do Prisma)
    const camposFormulario = Array.isArray(inscricao.edital.camposFormulario)
      ? (inscricao.edital.camposFormulario as Array<{ nome: string; label: string; tipo: string }>)
      : []

    const pdfBuffer = await generateProjetoCompleto({
      numero: inscricao.numero,
      status: inscricao.status,
      proponente: {
        nome: inscricao.proponente.nome,
        cpfCnpj: inscricao.proponente.cpfCnpj ?? '',
        email: inscricao.proponente.email,
        tipoProponente: inscricao.proponente.tipoProponente ?? 'PF',
      },
      edital: { titulo: inscricao.edital.titulo, ano: inscricao.edital.ano },
      categoria: inscricao.categoria,
      campos: parseCampos(inscricao.campos),
      camposFormulario,
      anexos: inscricao.anexos,
      submittedAt: inscricao.submittedAt ?? inscricao.createdAt,
    })

    console.log({
      requestId,
      method: 'GET',
      path: `/api/proponente/inscricoes/${id}/projeto-pdf`,
      status: 200,
      durationMs: Date.now() - start,
    })

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="projeto-${inscricao.numero}.pdf"`,
        'X-Request-Id': requestId,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown', stack: err instanceof Error ? err.stack : undefined })
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro ao gerar PDF do projeto.', requestId },
      { status: 500 },
    )
  }
}
