import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { ApiError, InternalError } from '@server/lib/http/errors'
import { ServiceError } from '@shared/service-error'
import { jsonError, jsonSuccess } from '@server/lib/http/response'
import type { PaginationMeta } from '@shared/dtos/common.dto'

export type RequestContext = {
  requestId: string
  method: string
  path: string
  body: unknown
  query: Record<string, string>
  params: Record<string, string>
  headers: Headers
}

export type ControllerFile = {
  body: Buffer | Uint8Array | string
  contentType: string
  filename?: string
  disposition?: 'inline' | 'attachment'
}

export type ControllerResult<T> =
  | {
      data: T
      status?: number
      meta?: PaginationMeta
      cacheControl?: string
    }
  | {
      file: ControllerFile
      status?: number
    }

export type Controller<T> = (ctx: RequestContext) => Promise<ControllerResult<T>>

type ParamsArg = { params: Promise<Record<string, string>> } | undefined

export function adaptNextRoute<T>(controller: Controller<T>) {
  return async (req: NextRequest, ctx?: ParamsArg) => {
    const requestId = req.headers.get('x-request-id') ?? randomUUID()
    const start = Date.now()
    const url = new URL(req.url)
    const path = url.pathname

    try {
      const params = (await ctx?.params) ?? {}
      const query = Object.fromEntries(url.searchParams)
      const body = await readBody(req)

      const result = await controller({
        requestId,
        method: req.method,
        path,
        body,
        query,
        params,
        headers: req.headers,
      })

      logRequest({ requestId, method: req.method, path, status: result.status ?? 200, durationMs: Date.now() - start })

      if ('file' in result) {
        const f = result.file
        const headers: Record<string, string> = {
          'Content-Type': f.contentType,
          'X-Request-Id': requestId,
          'Cache-Control': 'no-store',
        }
        if (f.filename) {
          headers['Content-Disposition'] = `${f.disposition ?? 'attachment'}; filename="${f.filename}"`
        }
        const body = typeof f.body === 'string' ? f.body : new Uint8Array(f.body)
        return new NextResponse(body, { status: result.status ?? 200, headers })
      }

      return jsonSuccess(result.data, {
        requestId,
        status: result.status,
        meta: result.meta,
        cacheControl: result.cacheControl,
      })
    } catch (err) {
      return handleError(err, { requestId, method: req.method, path, start })
    }
  }
}

async function readBody(req: NextRequest): Promise<unknown> {
  if (req.method === 'GET' || req.method === 'DELETE' || req.method === 'HEAD') return undefined
  const contentType = req.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    try {
      return await req.json()
    } catch {
      return undefined
    }
  }
  if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
    return await req.formData()
  }
  return undefined
}

function handleError(
  err: unknown,
  meta: { requestId: string; method: string; path: string; start: number },
) {
  const durationMs = Date.now() - meta.start

  if (err instanceof ApiError) {
    logRequest({ ...meta, status: err.status, durationMs, errorCode: err.code })
    return jsonError({
      status: err.status,
      code: err.code,
      message: err.message,
      details: err.details,
      requestId: meta.requestId,
    })
  }

  if (err instanceof ZodError) {
    logRequest({ ...meta, status: 400, durationMs, errorCode: 'VALIDATION_ERROR' })
    return jsonError({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Parâmetros inválidos',
      details: err.issues.map((i) => ({ path: i.path, message: i.message })),
      requestId: meta.requestId,
    })
  }

  if (err instanceof ServiceError) {
    logRequest({ ...meta, status: err.httpStatus, durationMs, errorCode: err.code })
    return jsonError({
      status: err.httpStatus,
      code: err.code,
      message: err.message,
      requestId: meta.requestId,
    })
  }

  const internal = new InternalError()
  console.error({
    requestId: meta.requestId,
    method: meta.method,
    path: meta.path,
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  })
  logRequest({ ...meta, status: internal.status, durationMs, errorCode: internal.code })
  return jsonError({
    status: internal.status,
    code: internal.code,
    message: internal.message,
    requestId: meta.requestId,
  })
}

function logRequest(entry: {
  requestId: string
  method: string
  path: string
  status: number
  durationMs: number
  errorCode?: string
}) {
  console.log(entry)
}
