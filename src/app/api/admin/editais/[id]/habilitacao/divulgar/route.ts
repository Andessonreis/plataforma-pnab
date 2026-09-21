import { NextRequest } from 'next/server'
import { z } from 'zod'
import type { UserRole } from '@prisma/client'
import { auth } from '@/lib/auth'
import {
  createContext,
  ok,
  badRequest,
  unauthorized,
  forbidden,
  handleError,
  logRequest,
} from '@/lib/api/response'
import { getIp } from '@/lib/api/auth-resolver'
import {
  ROLES_HABILITACAO,
  MENSAGEM_FORA_DA_EQUIPE,
  acessoHabilitacaoPermitido,
} from '@/lib/edital/acesso-habilitacao'
import { divulgarResultadoHabilitacao } from '@/lib/services/divulgacao-habilitacao.service'

export const runtime = 'nodejs'

const bodySchema = z.object({
  enviarEmail: z.boolean().default(true),
  totalEsperado: z.number().int().nonnegative(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/admin/editais/[id]/habilitacao/divulgar
 *
 * Divulga o resultado da habilitação já conferido: passa a aparecer para o
 * proponente e na lista pública. Por padrão avisa cada proponente por e-mail;
 * quem opera pode desmarcar o envio. `totalEsperado` é a quantidade que a tela
 * confirmou: se a lista mudou nesse meio tempo, nada é divulgado (409). Fica
 * registrado em auditoria.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const ctx = createContext()

  try {
    const session = await auth()
    if (!session) return unauthorized(ctx)
    const role = session.user.role as UserRole
    if (!ROLES_HABILITACAO.includes(role)) return forbidden(ctx)

    const { id: editalId } = await params
    const ip = getIp(req)

    const dentroDoEscopo = await acessoHabilitacaoPermitido({
      userId: session.user.id,
      role,
      editalId,
      alvo: { entity: 'Edital', id: editalId },
      ip,
    })
    if (!dentroDoEscopo) return forbidden(ctx, MENSAGEM_FORA_DA_EQUIPE)

    const corpo = await req.json().catch(() => undefined)
    if (corpo === undefined) return badRequest(ctx, 'Corpo da requisição inválido.')
    const { enviarEmail, totalEsperado } = bodySchema.parse(corpo)

    const resultado = await divulgarResultadoHabilitacao({
      editalId,
      enviarEmail,
      totalEsperado,
      userId: session.user.id,
      ip,
    })

    logRequest(ctx, 'POST', `/api/admin/editais/${editalId}/habilitacao/divulgar`, 200)
    return ok(ctx, resultado)
  } catch (err) {
    return handleError(ctx, err)
  }
}
