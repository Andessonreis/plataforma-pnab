import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { downloadFile, extractStoragePath } from '@/lib/storage'
import {
  DECLARACAO_PARCERIA_TEMPLATE_KEY,
  declaracaoParceriaSchema,
  gerarDeclaracaoParceria,
} from '@/lib/pdf/templates/declaracao-parceria'
import { EDITAL_SLUG_MESTRES_E_MESTRAS } from '@/lib/constants/editais-especiais'

export const runtime = 'nodejs'

const ANEXO_01_TITULO = 'Anexo 01 — Declaração de Parceria'

/**
 * Gera um documento a partir de um modelo oficial do edital + dados digitados
 * no formulário guiado (hoje só o Anexo 01 do Mestres e Mestras). Não persiste
 * nada — devolve o PDF pronto pra download; o proponente ainda precisa assinar
 * e reenviar pelo upload de anexo normal.
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

    const edital = await prisma.edital.findUnique({
      where: { slug: EDITAL_SLUG_MESTRES_E_MESTRAS },
      select: { id: true },
    })
    if (!edital) {
      const res = NextResponse.json(
        { error: 'NOT_FOUND', message: 'Edital não encontrado.', requestId },
        { status: 404 },
      )
      res.headers.set('X-Request-Id', requestId)
      return res
    }

    const arquivo = await prisma.arquivoEdital.findFirst({
      where: { editalId: edital.id, titulo: ANEXO_01_TITULO },
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
