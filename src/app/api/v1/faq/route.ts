import { NextRequest } from 'next/server'
import { createContext, ok, created, handleError, forbidden, logRequest } from '@/lib/api/response'
import { resolveAuth, requireRole, getIp } from '@/lib/api/auth-resolver'
import { faqSchema } from '@/lib/schemas/faq'
import * as faqService from '@/lib/services/faq.service'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const ctx = createContext()
  try {
    const editalId = new URL(req.url).searchParams.get('editalId') ?? undefined
    const items = await faqService.listFaq(editalId)
    logRequest(ctx, 'GET', '/api/v1/faq', 200)
    return ok(ctx, items, 'public, s-maxage=60, stale-while-revalidate=300')
  } catch (err) {
    return handleError(ctx, err)
  }
}

export async function POST(req: NextRequest) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireRole(caller, 'ADMIN', 'ATENDIMENTO')) return forbidden(ctx)
    const data = faqSchema.parse(await req.json())
    const result = await faqService.createFaq(data, caller.userId, getIp(req))
    logRequest(ctx, 'POST', '/api/v1/faq', 201)
    return created(ctx, result)
  } catch (err) {
    return handleError(ctx, err)
  }
}
