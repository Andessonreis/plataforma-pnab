import { NextRequest, NextResponse } from 'next/server'
import { createContext, okPaginated, handleError, forbidden, logRequest } from '@/lib/api/response'
import { resolveAuth, requireRole, getIp } from '@/lib/api/auth-resolver'
import { listarRespostasSchema } from '@/lib/schemas/questionario'
import * as respostaService from '@/lib/services/questionario-resposta.service'
import { ROLES_MEMORIAL } from '@/lib/memorial/acesso'

export const runtime = 'nodejs'

interface RouteParams { params: Promise<{ id: string }> }

/** Lista paginada das respostas; `?formato=csv` baixa todas de uma vez. */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireRole(caller, ...ROLES_MEMORIAL)) return forbidden(ctx)
    const { id } = await params
    const { page, pageSize, formato } = listarRespostasSchema.parse(
      Object.fromEntries(new URL(req.url).searchParams),
    )

    if (formato === 'csv') {
      const { csv, nomeArquivo } = await respostaService.exportarRespostasCsv(id, caller.userId, getIp(req))
      logRequest(ctx, 'GET', `/api/v1/questionarios/${id}/respostas?formato=csv`, 200)
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${nomeArquivo}"`,
          'X-Request-Id': ctx.requestId,
          'Cache-Control': 'no-store',
        },
      })
    }

    const result = await respostaService.listarRespostas(id, page, pageSize)
    logRequest(ctx, 'GET', `/api/v1/questionarios/${id}/respostas`, 200)
    return okPaginated(ctx, result.data, result.meta)
  } catch (err) {
    return handleError(ctx, err)
  }
}
