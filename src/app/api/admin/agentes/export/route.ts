import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'
import { toCsv } from '@/lib/export/csv'
import { generateListaAgentes } from '@/lib/pdf/lista-agentes'
import { labelDoCampo, valorDoCampo } from '@/lib/agentes/campos'
import {
  camposDeFiltros,
  descreverFiltros,
  filtrosAgentesSchema,
  queryParaFiltros,
} from '@/lib/agentes/filtros'
import { listarAgentesParaExportar, LIMITE_EXPORTACAO } from '@/lib/services/agentes.service'

export const runtime = 'nodejs'

const querySchema = filtrosAgentesSchema.extend({
  formato: z.enum(['csv', 'pdf']).default('csv'),
})

/**
 * Exporta a lista de agentes culturais no recorte pedido.
 *
 * CSV leva o documento completo — é o arquivo de trabalho da equipe, usado pra
 * conferir cadastro. O PDF circula impresso, então mascara o CPF/CNPJ.
 */
export async function GET(req: NextRequest) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const session = await auth()
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return respostaDeErro('FORBIDDEN', 'Acesso negado.', 403, requestId)
    }

    const params = querySchema.parse(queryParaFiltros(new URL(req.url).searchParams))
    const campos = camposDeFiltros(params)
    const filtros = descreverFiltros(params)

    const agentes = await listarAgentesParaExportar(params)
    const datePart = new Date().toISOString().slice(0, 10)

    const arquivo =
      params.formato === 'pdf'
        ? {
            nome: `agentes_pnab_${datePart}.pdf`,
            tipo: 'application/pdf',
            corpo: new Uint8Array(await generateListaAgentes({ filtros, campos, agentes })),
          }
        : {
            nome: `agentes_pnab_${datePart}.csv`,
            tipo: 'text/csv; charset=utf-8',
            corpo: toCsv([
              campos.map(labelDoCampo),
              ...agentes.map((agente) =>
                campos.map((campo) => valorDoCampo(agente, campo, { mascararDocumento: false })),
              ),
            ]),
          }

    await logAudit({
      userId: session.user.id,
      action: AUDIT_ACTIONS.EXPORTACAO_AGENTES,
      entity: 'User',
      details: {
        formato: params.formato,
        totalRegistros: agentes.length,
        truncado: agentes.length === LIMITE_EXPORTACAO,
        campos: campos.join(', '),
        filtros: filtros.map((f) => `${f.label}: ${f.value}`).join(' | '),
      },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    console.log({
      requestId,
      method: 'GET',
      path: '/api/admin/agentes/export',
      status: 200,
      durationMs: Date.now() - start,
    })

    return new NextResponse(arquivo.corpo, {
      status: 200,
      headers: {
        'Content-Type': arquivo.tipo,
        'Content-Disposition': `attachment; filename="${arquivo.nome}"`,
        'X-Request-Id': requestId,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return respostaDeErro('VALIDATION_ERROR', 'Filtros inválidos.', 400, requestId)
    }

    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    return respostaDeErro('INTERNAL_ERROR', 'Erro ao gerar a exportação.', 500, requestId)
  }
}

function respostaDeErro(error: string, message: string, status: number, requestId: string) {
  const res = NextResponse.json({ error, message, requestId }, { status })
  res.headers.set('X-Request-Id', requestId)
  res.headers.set('Cache-Control', 'no-store')
  return res
}
