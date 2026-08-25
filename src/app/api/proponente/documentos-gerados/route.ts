import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { downloadFile, extractStoragePath } from '@/lib/storage'
import {
  ANEXO_01_TITULO,
  DECLARACAO_PARCERIA_TEMPLATE_KEY,
  declaracaoParceriaSchema,
  gerarDeclaracaoParceria,
} from '@/lib/pdf/templates/declaracao-parceria'

export const runtime = 'nodejs'

/**
 * Gera um documento a partir de um modelo oficial do edital + dados digitados
 * no formulário guiado. Funciona pra qualquer edital que tenha um arquivo
 * MODELO_EDITAL com título "Anexo 01 — Declaração de Parceria" cadastrado —
 * não é exclusivo de um edital específico. Não persiste nada — devolve o PDF
 * pronto pra download; o proponente ainda precisa assinar e reenviar pelo
 * upload de anexo normal.
 */
export async function POST(req: NextRequest) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const session = await auth()
    if (!session || session.user.role !== 'PROPONENTE') {
      const res = NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Não autenticado.', requestId },
        { status: 401 },
      )
      res.headers.set('X-Request-Id', requestId)
      return res
    }

    const body = await req.json().catch(() => null)
    if (body?.templateKey !== DECLARACAO_PARCERIA_TEMPLATE_KEY) {
      const res = NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Modelo de documento desconhecido.', requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      return res
    }

    if (typeof body.editalId !== 'string' || !body.editalId) {
      const res = NextResponse.json(
        { error: 'BAD_REQUEST', message: 'editalId é obrigatório.', requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      return res
    }

    const parsed = declaracaoParceriaSchema.safeParse(body.dados)
    if (!parsed.success) {
      const res = NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message ?? 'Dados inválidos.',
          requestId,
        },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      return res
    }

    const arquivo = await prisma.arquivoEdital.findFirst({
      where: { editalId: body.editalId, titulo: ANEXO_01_TITULO },
      select: { url: true },
    })
    const storagePath = arquivo ? extractStoragePath('editais', arquivo.url) : null
    if (!storagePath) {
      const res = NextResponse.json(
        { error: 'NOT_FOUND', message: 'Modelo do Anexo 01 não encontrado no edital.', requestId },
        { status: 404 },
      )
      res.headers.set('X-Request-Id', requestId)
      return res
    }

    const templateBytes = await downloadFile('editais', storagePath)
    const pdfBuffer = await gerarDeclaracaoParceria(templateBytes, parsed.data)

    console.log({
      requestId,
      method: 'POST',
      path: '/api/proponente/documentos-gerados',
      status: 200,
      durationMs: Date.now() - start,
    })

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="anexo-01-declaracao-parceria-preenchido.pdf"',
        'X-Request-Id': requestId,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error({
      requestId,
      error: err instanceof Error ? err.message : 'Unknown',
      stack: err instanceof Error ? err.stack : undefined,
    })
    const res = NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro ao gerar documento.', requestId },
      { status: 500 },
    )
    res.headers.set('X-Request-Id', requestId)
    return res
  }
}
