import { randomUUID } from 'crypto'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { ApiError, InternalError } from '@server/lib/http/errors'
import { requireAdmin } from '@server/lib/auth/guards'
import { resultadosEditalService } from '@server/modules/editais/resultados-edital/resultados-edital.service'
import { listaInscricoesQuerySchema } from '@shared/schemas/resultados-edital.schema'
import type { InscricaoStatus } from '@prisma/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function clientIp(headers: Headers): string | null {
  return (
    headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    headers.get('x-real-ip') ??
    null
  )
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const requestId = req.headers.get('x-request-id') ?? randomUUID()
  const start = Date.now()
  const { id } = await ctx.params
  const path = `/api/v1/editais/edital/${id}/listas`

  try {
    const user = await requireAdmin(req.headers)
    const url = new URL(req.url)
    const { status } = listaInscricoesQuerySchema.parse({
      status: url.searchParams.get('status'),
    })

    const { buffer, filename } = await resultadosEditalService.gerarLista(
      id,
      status as InscricaoStatus,
      { actorId: user.id, ip: clientIp(req.headers) },
    )

    console.log({ requestId, method: 'GET', path, status: 200, durationMs: Date.now() - start })

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Request-Id': requestId,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    const apiError = err instanceof ApiError ? err : new InternalError()
    if (!(err instanceof ApiError)) {
      console.error({
        requestId,
        path,
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      })
    }
    console.log({ requestId, method: 'GET', path, status: apiError.status, durationMs: Date.now() - start })
    return NextResponse.json(
      { error: apiError.code, message: apiError.message, requestId },
      {
        status: apiError.status,
        headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' },
      },
    )
  }
}
