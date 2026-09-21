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
import { ETAPAS_RECURSO_CHAVES } from '@/lib/edital/etapas-recurso'
import { emitirRelatorioRecursos } from '@/lib/services/relatorio-recursos.service'

export const runtime = 'nodejs'

const querySchema = z.object({ etapa: z.enum(ETAPAS_RECURSO_CHAVES) })

interface RouteContext {
  params: Promise<{ id: string }>
}

async function responder(req: NextRequest, ctx: ApiContext, editalId: string) {
  const session = await auth()
  if (!session) return unauthorized(ctx)
  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) return forbidden(ctx)

  const query = querySchema.safeParse({ etapa: new URL(req.url).searchParams.get('etapa') })
  if (!query.success) {
    return badRequest(ctx, `Parâmetro "etapa" obrigatório. Use: ${ETAPAS_RECURSO_CHAVES.join(' ou ')}.`)
  }

  const { buffer, filename } = await emitirRelatorioRecursos({
    editalId,
    etapa: query.data.etapa,
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
 * GET /api/admin/editais/[id]/relatorio-recursos?etapa=habilitacao|selecao
 *
 * Emite o extrato dos recursos interpostos na etapa, inclusive quando não
 * houve nenhum. Cada emissão gera código verificável e entrada de auditoria.
 */
export async function GET(req: NextRequest, { params }: RouteContext) {
  const ctx = createContext()
  const { id: editalId } = await params

  const res = await responder(req, ctx, editalId).catch((err) => handleError(ctx, err))
  logRequest(ctx, 'GET', `/api/admin/editais/${editalId}/relatorio-recursos`, res.status)
  return res
}
