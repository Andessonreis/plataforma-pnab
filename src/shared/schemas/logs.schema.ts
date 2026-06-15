import { z } from 'zod'

export const logsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  action: z.string().optional(),
  userId: z.string().optional(),
  entity: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
})

export type LogsQueryInput = z.infer<typeof logsQuerySchema>
