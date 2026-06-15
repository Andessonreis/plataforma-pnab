import { NextRequest, NextResponse } from 'next/server'
import {
  createContext,
  ok,
  notFound,
  handleError,
  logRequest,
} from '@/lib/api/response'
import { rateLimit } from '@/lib/rate-limit'
import { RATE_LIMITS } from '@/lib/rate-limit/config'
import { cnpjLookupSchema } from '@/lib/schemas/cnpj'
import { lookupCnpj } from '@/lib/cnpj/lookup'

export const runtime = 'nodejs'

const PATH = '/api/cnpj/lookup'

// Mascara o CNPJ para log estruturado: mantém os 8 primeiros dígitos (raiz+filial
// parcial) e oculta o restante. Não logar dígitos completos evita PII em logs.
function maskCnpj(cnpj: string): string {
  if (cnpj.length !== 14) return '****'
  return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/****-**`
}

export async function POST(req: NextRequest) {
  const ctx = createContext()

  try {
    const limited = await rateLimit(req, 'cnpj/lookup', RATE_LIMITS['cnpj/lookup'])
    if (limited) return limited

    const body = await req.json()
    const { cnpj } = cnpjLookupSchema.parse(body)

    const result = await lookupCnpj(cnpj)

    if (!result.ok && result.reason === 'NOT_FOUND') {
      logRequest(ctx, 'POST', `${PATH} [${maskCnpj(cnpj)}]`, 404)
      return notFound(ctx, 'CNPJ não encontrado na Receita Federal.')
    }

    if (!result.ok && result.reason === 'UPSTREAM_ERROR') {
      const res = NextResponse.json(
        {
          error: 'BAD_GATEWAY',
          message: 'Serviço de consulta indisponível no momento. Preencha os dados manualmente.',
          requestId: ctx.requestId,
        },
        { status: 502 },
      )
      res.headers.set('X-Request-Id', ctx.requestId)
      res.headers.set('Cache-Control', 'no-store')
      logRequest(ctx, 'POST', `${PATH} [${maskCnpj(cnpj)}]`, 502)
      return res
    }

    if (result.ok) {
      logRequest(
        ctx,
        'POST',
        `${PATH} [${maskCnpj(cnpj)}] cached=${result.cached} fonte=${result.data.fonte}`,
        200,
      )
      // LGPD: rota pública (usada no cadastro pré-login). Devolve só dados
      // cadastrais da empresa — omite socios/email/telefone (PII de pessoas).
      const { socios: _s, email: _e, telefone: _t, ...empresa } = result.data
      return ok(ctx, empresa, 'no-store')
    }

    // Exaustão de tipos — satisfaz TS.
    return handleError(ctx, new Error('Unexpected lookup outcome'))
  } catch (err) {
    return handleError(ctx, err)
  }
}
