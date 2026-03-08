import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateComprovante } from '@/lib/pdf/comprovante'

export const runtime = 'nodejs'

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
          select: { titulo: true, ano: true },
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

    // Só gera comprovante para inscrições já enviadas
    if (inscricao.status === 'RASCUNHO') {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Comprovante disponível apenas para inscrições enviadas.', requestId },
        { status: 400 },
      )
    }

    const pdfBuffer = await generateComprovante({
      numero: inscricao.numero,
      proponente: {
        nome: inscricao.proponente.nome,
        cpfCnpj: inscricao.proponente.cpfCnpj ?? '',
        email: inscricao.proponente.email,
        tipoProponente: inscricao.proponente.tipoProponente ?? 'PF',
      },
      edital: inscricao.edital,
      categoria: inscricao.categoria,
      submittedAt: inscricao.submittedAt ?? inscricao.createdAt,
      campos: inscricao.campos as Record<string, unknown>,
    })

    console.log({
      requestId,
      method: 'GET',
      path: `/api/proponente/inscricoes/${id}/comprovante`,
      status: 200,
      durationMs: Date.now() - start,
    })

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="comprovante-${inscricao.numero}.pdf"`,
        'X-Request-Id': requestId,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro ao gerar comprovante.', requestId },
      { status: 500 },
    )
  }
}
