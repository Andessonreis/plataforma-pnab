import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateProjetoCompleto } from '@/lib/pdf/projeto-completo'
import { mesclarAnexosNoPdf } from '@/lib/pdf/dossie-completo'
import { statusVisivelParaProponente } from '@/lib/edital/resultado-habilitacao'
import { registrarEmissao } from '@/lib/documentos/emissao'
import { INCLUDE_PROJETO_COMPLETO, montarDadosProjeto } from '@/lib/inscricoes/projeto-completo-dados'

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
      include: INCLUDE_PROJETO_COMPLETO,
    })

    if (!inscricao) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Inscrição não encontrada.', requestId },
        { status: 404 },
      )
    }

    // Apenas o proponente dono ou ADMIN pode baixar
    const isOwner = inscricao.proponente.id === session.user.id
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
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

    // Dono da inscrição só vê o status real depois de liberado — mesma
    // máscara da tela e das demais rotas (ver resultado-habilitacao.ts).
    const statusPdf = isAdmin
      ? inscricao.status
      : statusVisivelParaProponente(inscricao.status, inscricao.resultadoLiberadoEm !== null)

    const emissao = await registrarEmissao({
      tipo: 'PROJETO_COMPLETO',
      titulo: `Projeto completo — inscrição ${inscricao.numero}`,
      editalId: inscricao.editalId,
      emitidoPorId: session.user.id,
      conteudo: { numero: inscricao.numero, categoria: inscricao.categoria },
      metadados: { Inscrição: inscricao.numero },
    })

    let pdfBuffer = await generateProjetoCompleto(
      montarDadosProjeto(inscricao, { status: statusPdf, emissao }),
    )

    // Modo "dossiê completo" — mescla os arquivos de anexo reais no PDF.
    // Restrito a ADMIN: é um relatório de arquivamento da Secretaria, mais
    // pesado (baixa cada anexo do storage), não o comprovante de rotina do proponente.
    const completo = req.nextUrl.searchParams.get('completo') === '1'
    let filename = `projeto-${inscricao.numero}.pdf`
    if (completo && isAdmin) {
      pdfBuffer = await mesclarAnexosNoPdf(pdfBuffer, inscricao.anexos)
      filename = `dossie-completo-${inscricao.numero}.pdf`
    }

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
        'Content-Disposition': `attachment; filename="${filename}"`,
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
