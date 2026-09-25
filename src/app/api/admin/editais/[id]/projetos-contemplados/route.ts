import { NextRequest, NextResponse } from 'next/server'
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
import { emitirProjetosContemplados } from '@/lib/services/projetos-contemplados.service'

export const runtime = 'nodejs'

const MENSAGEM_ANEXOS_INVALIDO = 'Parâmetro "anexos" inválido. Use 1 ou omita.'

interface RouteContext {
  params: Promise<{ id: string }>
}

async function responder(req: NextRequest, ctx: ApiContext, editalId: string) {
  const session = await auth()
  if (!session) return unauthorized(ctx)
  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) return forbidden(ctx)

  // Vazio vale como ausente; só o "1" liga a opção, qualquer outro valor é engano de quem chama.
  const anexos = new URL(req.url).searchParams.get('anexos')
  if (anexos && anexos !== '1') return badRequest(ctx, MENSAGEM_ANEXOS_INVALIDO)

  const { buffer, filename } = await emitirProjetosContemplados({
    editalId,
    incluirAnexos: anexos === '1',
    userId: session.user.id,
    role: session.user.role,
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
 * GET /api/admin/editais/[id]/projetos-contemplados[?anexos=1]
 *
 * Um único PDF com o projeto completo de todos os contemplados, na ordem da
 * classificação. Com `anexos=1`, cada projeto vem seguido dos arquivos que o
 * proponente anexou (fotos e documentos). Cada emissão gera código verificável
 * e entrada de auditoria.
 */
export async function GET(req: NextRequest, { params }: RouteContext) {
  const ctx = createContext()
  const { id: editalId } = await params

  const res = await responder(req, ctx, editalId).catch((err) => handleError(ctx, err))
  logRequest(ctx, 'GET', `/api/admin/editais/${editalId}/projetos-contemplados`, res.status)
  return res
}
