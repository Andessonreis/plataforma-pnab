import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { getPublicacao, PUBLICACAO_LABELS } from '@/lib/edital/publicacoes'
import { isAcaoPublicacao, ACOES_PUBLICACAO } from '@/types/cronograma'
import { maskCpfCnpj, maskName } from '@/lib/utils/mask'
import { toCsv } from '@/lib/export/csv'
import { inscricaoStatusLabel } from '@/lib/status-maps'

export const runtime = 'nodejs'

const querySchema = z.object({
  format: z.enum(['json', 'csv']).default('json'),
})

interface RouteContext {
  params: Promise<{ slug: string; acao: string }>
}

export async function GET(req: NextRequest, context: RouteContext) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const { slug, acao } = await context.params
    const parsedQuery = querySchema.safeParse(
      Object.fromEntries(new URL(req.url).searchParams),
    )
    if (!parsedQuery.success) {
      return jsonError(400, 'BAD_REQUEST', 'Parâmetro "format" inválido (use json|csv).', requestId)
    }

    if (!isAcaoPublicacao(acao)) {
      return jsonError(
        404,
        'NOT_FOUND',
        `Ação desconhecida. Use uma de: ${ACOES_PUBLICACAO.join(', ')}.`,
        requestId,
      )
    }

    const publicacao = await getPublicacao(slug, acao)

    if (!publicacao) {
      return jsonError(404, 'NOT_FOUND', 'Edital não encontrado.', requestId)
    }

    if (!publicacao.exists) {
      return jsonError(
        404,
        'PUBLICACAO_NAO_CONFIGURADA',
        `O cronograma deste edital não possui o marco "${PUBLICACAO_LABELS[acao]}".`,
        requestId,
      )
    }

    if (!publicacao.visivel) {
      const res = NextResponse.json(
        {
          error: 'PUBLICACAO_NAO_DISPONIVEL',
          message: `A ${publicacao.label.toLowerCase()} ainda não foi publicada.`,
          dataPublicacao: publicacao.dataPublicacao,
          requestId,
        },
        { status: 409 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      logRequest(requestId, 'GET', req.url, 409, start)
      return res
    }

    // Mascarar dados sensíveis antes de devolver
    const itemsPublicos = publicacao.items.map((i) => ({
      numero: i.numero,
      nome: maskName(i.nome),
      cpfCnpj: maskCpfCnpj(i.cpfCnpj),
      categoria: i.categoria ?? null,
      status: i.status,
      statusLabel: inscricaoStatusLabel[i.status] ?? i.status,
    }))

    if (parsedQuery.data.format === 'csv') {
      const rows: Array<Array<string | number>> = [
        ['Numero', 'Nome', 'CPF/CNPJ', 'Categoria', 'Status'],
        ...itemsPublicos.map((i) => [
          i.numero,
          i.nome,
          i.cpfCnpj,
          i.categoria ?? '',
          i.statusLabel,
        ]),
      ]
      const csv = toCsv(rows)
      const datePart = new Date().toISOString().slice(0, 10)
      const filename = `${acao.toLowerCase()}_${slug}_${datePart}.csv`

      logRequest(requestId, 'GET', req.url, 200, start)
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'X-Request-Id': requestId,
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      })
    }

    const res = NextResponse.json({
      data: {
        acao,
        label: publicacao.label,
        dataPublicacao: publicacao.dataPublicacao,
        total: itemsPublicos.length,
        items: itemsPublicos,
      },
    })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    logRequest(requestId, 'GET', req.url, 200, start)
    return res
  } catch (err) {
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    return jsonError(500, 'INTERNAL_ERROR', 'Erro ao processar a publicação.', requestId)
  }
}

function jsonError(status: number, error: string, message: string, requestId: string) {
  const res = NextResponse.json({ error, message, requestId }, { status })
  res.headers.set('X-Request-Id', requestId)
  res.headers.set('Cache-Control', 'no-store')
  return res
}

function logRequest(requestId: string, method: string, url: string, status: number, start: number) {
  const path = new URL(url).pathname
  console.log({ requestId, method, path, status, durationMs: Date.now() - start })
}
