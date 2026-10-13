import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createContext, ok, handleError, logRequest } from '@/lib/api/response'
import * as questionarioService from '@/lib/services/questionario.service'

export const runtime = 'nodejs'

interface RouteParams { params: Promise<{ slug: string }> }

const slugSchema = z.string().trim().min(1).max(80)

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const ctx = createContext()
  try {
    const slug = slugSchema.parse((await params).slug)
    const result = await questionarioService.obterQuestionarioPublicado(slug)
    logRequest(ctx, 'GET', `/api/v1/questionarios/publico/${slug}`, 200)
    return ok(ctx, result, 'public, s-maxage=60, stale-while-revalidate=300')
  } catch (err) {
    return handleError(ctx, err)
  }
}
