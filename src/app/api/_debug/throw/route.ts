/**
 * Rota de diagnóstico — lança uma exception intencional para validar que
 * o instrumentation (onRequestError) está capturando e persistindo em ErrorLog.
 *
 * Protegida por token via query string (`?token=<DEBUG_THROW_TOKEN>` da env)
 * para não virar DoS público. Remover após validação.
 */
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const expected = process.env.DEBUG_THROW_TOKEN
  const given = new URL(req.url).searchParams.get('token')

  if (!expected || given !== expected) {
    return new Response('Not Found', { status: 404 })
  }

  throw new Error(`[debug-probe] Exception intencional para validar ErrorLog (ts=${Date.now()})`)
}
