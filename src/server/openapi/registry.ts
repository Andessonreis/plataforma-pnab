import { extendZodWithOpenApi, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

extendZodWithOpenApi(z)

export const registry = new OpenAPIRegistry()

export const bearerAuth = registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  description: 'API key de consumidor externo: `Authorization: Bearer pnab_<sua-chave>`',
})

export const cookieAuth = registry.registerComponent('securitySchemes', 'cookieAuth', {
  type: 'apiKey',
  in: 'cookie',
  name: 'pnab.access',
  description: 'Sessão do portal (JWT no cookie pnab.access)',
})

/** Envelope de sucesso `{ data, requestId }` usado por todas as respostas. */
export function envelope<T extends z.ZodTypeAny>(data: T) {
  return z.object({ data, requestId: z.string() })
}

/** Envelope paginado `{ data: [...], meta, requestId }`. */
export function paginatedEnvelope<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    data: z.array(item),
    meta: z.object({
      page: z.number(),
      pageSize: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
    requestId: z.string(),
  })
}

export const errorResponse = z.object({
  error: z.string(),
  message: z.string(),
  requestId: z.string(),
  details: z.unknown().optional(),
})
