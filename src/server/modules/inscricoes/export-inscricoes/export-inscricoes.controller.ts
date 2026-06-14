import { z } from 'zod'
import type { RequestContext } from '@server/adapters/next-route'
import { requireRole } from '@server/lib/auth/guards'
import { exportInscricoesCsv } from './export-inscricoes.service'

const querySchema = z.object({ editalId: z.string().optional(), status: z.string().optional() })

function ipFromHeaders(headers: Headers): string | undefined {
  return headers.get('x-forwarded-for')?.split(',')[0].trim() ?? headers.get('x-real-ip') ?? undefined
}

export const exportInscricoesController = {
  async export(ctx: RequestContext) {
    const user = await requireRole(ctx.headers, 'ADMIN')
    const { editalId, status } = querySchema.parse(ctx.query)
    const csv = await exportInscricoesCsv(editalId, status, user.id, ipFromHeaders(ctx.headers))
    const datePart = new Date().toISOString().slice(0, 10)
    const statusPart = status ? `_${status.toLowerCase()}` : ''
    return {
      file: {
        body: csv,
        contentType: 'text/csv; charset=utf-8',
        filename: `inscricoes_pnab${statusPart}_${datePart}.csv`,
      },
    }
  },
}
