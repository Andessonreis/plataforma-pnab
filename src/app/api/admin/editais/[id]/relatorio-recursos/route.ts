import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import {
  badRequest,
  createContext,
  forbidden,
  handleError,
  logRequest,
  unauthorized,
  type ApiContext,
} from '@/lib/api/response'
import { MENSAGEM_TEMPLATE_INVALIDO, templateDaUrl } from '@/lib/documentos/template-query'
import { ETAPAS_RECURSO_CHAVES } from '@/lib/edital/etapas-recurso'
import { emitirRelatorioRecursos } from '@/lib/services/relatorio-recursos.service'

export const runtime = 'nodejs'

const querySchema = z.object({ etapa: z.enum(ETAPAS_RECURSO_CHAVES) })

const MENSAGEM_SEM_PROTOCOLO_INVALIDO = 'Parâmetro "semProtocolo" inválido. Use 1 ou omita.'

interface RouteContext {
  params: Promise<{ id: string }>
}

async function responder(req: NextRequest, ctx: ApiContext, editalId: string) {
  const session = await auth()
  if (!session) return unauthorized(ctx)
  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) return forbidden(ctx)

  const { searchParams } = new URL(req.url)
  const query = querySchema.safeParse({ etapa: searchParams.get('etapa') })
  if (!query.success) {
    return badRequest(ctx, `Parâmetro "etapa" obrigatório. Use: ${ETAPAS_RECURSO_CHAVES.join(' ou ')}.`)
  }

  const template = templateDaUrl(req.url)
  if (!template.success) return badRequest(ctx, MENSAGEM_TEMPLATE_INVALIDO)

  // Vazio vale como ausente; só o "1" liga a opção, qualquer outro valor é engano de quem chama.
  const semProtocolo = searchParams.get('semProtocolo')
  if (semProtocolo && semProtocolo !== '1') return badRequest(ctx, MENSAGEM_SEM_PROTOCOLO_INVALIDO)

  const { buffer, filename } = await emitirRelatorioRecursos({
    editalId,
    etapa: query.data.etapa,
    template: template.data.template,
    ocultarProtocolo: semProtocolo === '1',
    userId: session.user.id,
    ip: req.headers.get('x-forwarded-for') ?? undefined,
  })

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'X-Request-Id': ctx.requestId,
      'Cache-Control': 'no-store',
    },
  })
}

/**
 * GET /api/admin/editais/[id]/relatorio-recursos?etapa=habilitacao|selecao[&template=1|2][&semProtocolo=1]
 *
 * Emite o extrato dos recursos interpostos na etapa, inclusive quando não
 * houve nenhum. Cada emissão gera código verificável e entrada de auditoria.
 * Sem `template`, vale a última versão que quem emite usou naquele edital.
 * `semProtocolo=1` tira a coluna com a data e a hora de cada protocolo.
 */
export async function GET(req: NextRequest, { params }: RouteContext) {
  const ctx = createContext()
  const { id: editalId } = await params

  const res = await responder(req, ctx, editalId).catch((err) => handleError(ctx, err))
  logRequest(ctx, 'GET', `/api/admin/editais/${editalId}/relatorio-recursos`, res.status)
  return res
}
