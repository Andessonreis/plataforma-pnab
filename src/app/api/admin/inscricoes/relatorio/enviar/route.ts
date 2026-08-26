import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { enviarRelatorioInscricoes } from '@/lib/services/relatorio-inscricoes.service'
import type { InscricaoStatus } from '@prisma/client'

export const runtime = 'nodejs'

const STATUSES: InscricaoStatus[] = [
  'RASCUNHO', 'ENVIADA', 'HABILITADA', 'INABILITADA', 'EM_AVALIACAO',
  'RESULTADO_PRELIMINAR', 'RECURSO_ABERTO', 'RESULTADO_FINAL',
  'CONTEMPLADA', 'NAO_CONTEMPLADA', 'SUPLENTE',
]

const bodySchema = z.object({
  status: z.enum(STATUSES as [InscricaoStatus, ...InscricaoStatus[]]),
  editalId: z.string().min(1).optional(),
  categoria: z.string().min(1).optional(),
  ocultarTeste: z.boolean().default(true),
  /** 'todos' = todo ADMIN ativo; senão, ids de usuário escolhidos na tela. */
  destinatarios: z.union([z.literal('todos'), z.array(z.string().min(1)).min(1)]),
})

function erro(code: string, message: string, status: number, requestId: string) {
  const res = NextResponse.json({ error: code, message, requestId }, { status })
  res.headers.set('X-Request-Id', requestId)
  res.headers.set('Cache-Control', 'no-store')
  return res
}

export async function POST(req: NextRequest) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const session = await auth()
    if (!session) return erro('UNAUTHORIZED', 'Não autenticado.', 401, requestId)
    if (session.user.role !== 'ADMIN') return erro('FORBIDDEN', 'Acesso negado.', 403, requestId)

    const parsed = bodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return erro('VALIDATION_ERROR', 'Parâmetros inválidos.', 400, requestId)
    }
    const { status, editalId, categoria, ocultarTeste, destinatarios } = parsed.data

    // Só ADMIN ativo recebe relatório — nunca um proponente, mesmo que o id
    // venha adulterado no body.
    const destinatariosDb = await prisma.user.findMany({
      where: {
        ativo: true,
        role: 'ADMIN',
        ...(destinatarios === 'todos' ? {} : { id: { in: destinatarios } }),
      },
      select: { nome: true, email: true },
      orderBy: { nome: 'asc' },
    })

    if (destinatariosDb.length === 0) {
      return erro('BAD_REQUEST', 'Nenhum destinatário válido selecionado.', 400, requestId)
    }

    const origin = new URL(req.url).origin
    const resultado = await enviarRelatorioInscricoes({
      filtro: { status, editalId, categoria, ocultarTeste },
      destinatarios: destinatariosDb,
      solicitanteId: session.user.id,
      ip: req.headers.get('x-forwarded-for') ?? undefined,
      baseUrl: process.env.NEXT_PUBLIC_APP_URL ?? origin,
    })

    console.log({
      requestId,
      method: 'POST',
      path: '/api/admin/inscricoes/relatorio/enviar',
      status: 200,
      durationMs: Date.now() - start,
    })

    const res = NextResponse.json({ data: resultado, requestId })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown'
    console.error({ requestId, error: message })

    // Recorte vazio é erro do usuário, não do servidor
    if (message.includes('Nenhuma inscrição encontrada')) {
      return erro('BAD_REQUEST', message, 400, requestId)
    }
    return erro('INTERNAL_ERROR', 'Erro ao enviar o relatório.', 500, requestId)
  }
}
