import { z } from 'zod'

export const idSchema = z.string().uuid()

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
})

export type PaginationQuery = z.infer<typeof paginationQuerySchema>

export const sortDirectionSchema = z.enum(['asc', 'desc']).default('desc')

export const isoDateSchema = z.string().datetime()
