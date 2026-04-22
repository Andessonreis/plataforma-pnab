import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { captureError } from './capture'

type RouteHandler = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => Promise<Response> | Response

/**
 * Wrapper opt-in para route handlers do App Router.
 * Em caso de exception não tratada, persiste via captureError e
 * retorna 500 genérico sem vazar stack trace ao cliente.
 *
 * Uso:
 *   export const GET = withErrorLogging(async (req) => { ... })
 *
 * Não captura erros que o handler trata explicitamente (ex: Zod
 * validation que retorna 400) — só o que escapar como exception.
 */
export function withErrorLogging(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    const requestId = req.headers.get('x-request-id') ?? randomUUID()
    try {
      return await handler(req, ctx)
    } catch (err) {
      await captureError(err, {
        requestId,
        method: req.method,
        path: new URL(req.url).pathname,
        statusCode: 500,
        userAgent: req.headers.get('user-agent') ?? undefined,
        ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined,
      })

      const res = NextResponse.json(
        {
          error: 'INTERNAL_ERROR',
          message: 'Erro interno do servidor. O incidente foi registrado.',
          requestId,
        },
        { status: 500 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }
  }
}
