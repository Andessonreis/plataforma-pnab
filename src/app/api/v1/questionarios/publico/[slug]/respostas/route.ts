import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createContext, created, handleError, logRequest } from '@/lib/api/response'
import { resolveAuth, getIp } from '@/lib/api/auth-resolver'
import { rateLimit } from '@/lib/rate-limit'
import { RATE_LIMITS } from '@/lib/rate-limit/config'
import { envioRespostaSchema } from '@/lib/schemas/questionario'
import { registrarRespostaQuestionario } from '@/lib/services/questionario-resposta.service'

export const runtime = 'nodejs'

interface RouteParams { params: Promise<{ slug: string }> }

const slugSchema = z.string().trim().min(1).max(80)

export async function POST(req: NextRequest, { params }: RouteParams) {
  const ctx = createContext()
  try {
    const bloqueio = await rateLimit(req, 'questionario/resposta', RATE_LIMITS['questionario/resposta'])
    if (bloqueio) {
      bloqueio.headers.set('X-Request-Id', ctx.requestId)
      return bloqueio
    }

    const slug = slugSchema.parse((await params).slug)
    const { dados, nome, email } = envioRespostaSchema.parse(await req.json())
    const caller = await resolveAuth(req)

    const result = await registrarRespostaQuestionario({ slug }, dados, {
      userId: caller?.userId,
      nome,
      email,
      ip: getIp(req),
    })
    logRequest(ctx, 'POST', `/api/v1/questionarios/publico/${slug}/respostas`, 201)
    return created(ctx, { protocolo: result.protocolo, mensagemSucesso: result.mensagemSucesso })
  } catch (err) {
    return handleError(ctx, err)
  }
}
