import { z } from 'zod'
import type { RequestContext } from '@server/adapters/next-route'
import { requireRole } from '@server/lib/auth/guards'
import { exportInscricoesCsv } from './export-inscricoes.service'

const querySchema = z.object({ editalId: z.string().optional() })

function ipFromHeaders(headers: Headers): string | undefined {
  return headers.get('x-forwarded-for')?.split(',')[0].trim() ?? headers.get('x-real-ip') ?? undefined
}

export const exportInscricoesController = {
  async export(ctx: RequestContext) {
    const user = await requireRole(ctx.headers, 'ADMIN')
    const { editalId } = querySchema.parse(ctx.query)
    const csv = await exportInscricoesCsv(editalId, user.id, ipFromHeaders(ctx.headers))
    return { file: { body: csv, contentType: 'text/csv; charset=utf-8', filename: 'inscricoes.csv' } }
  },
}
