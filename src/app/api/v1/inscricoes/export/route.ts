import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createContext, handleError, forbidden } from '@/lib/api/response'
import { resolveAuth, requireRole, getIp } from '@/lib/api/auth-resolver'
import * as exportService from '@/lib/services/export.service'

export const runtime = 'nodejs'

const querySchema = z.object({ editalId: z.string().optional() })

export async function GET(req: NextRequest) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireRole(caller, 'ADMIN')) return forbidden(ctx)
    const { editalId } = querySchema.parse(Object.fromEntries(new URL(req.url).searchParams))
    const csv = await exportService.exportInscricoesCsv(editalId ?? '', caller.userId, getIp(req))
    const res = new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename=inscricoes.csv',
        'X-Request-Id': ctx.requestId,
        'Cache-Control': 'no-store',
      },
    })
    return res
  } catch (err) {
    return handleError(ctx, err)
  }
}
