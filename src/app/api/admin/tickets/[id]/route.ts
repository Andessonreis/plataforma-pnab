import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import type { UserRole } from '@prisma/client'
import { enqueueEmail } from '@/lib/queue'

export const runtime = 'nodejs'

const ROLES_PERMITIDOS: UserRole[] = ['ADMIN', 'ATENDIMENTO']

const patchSchema = z.object({
  status: z.enum(['ABERTO', 'EM_ATENDIMENTO', 'FECHADO']).optional(),
  resposta: z
    .object({
      texto: z.string().min(5, 'Resposta deve ter no mínimo 5 caracteres'),
    })
    .optional(),
})

interface HistoricoItem {
  de: string
  texto: string
  criadoEm: string
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const session = await auth()
    const role = session?.user?.role as UserRole | undefined

    if (!session || !role || !ROLES_PERMITIDOS.includes(role)) {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso negado.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const { id } = await params

    const ticket = await prisma.atendimento.findUnique({
      where: { id },
      include: { autor: { select: { nome: true, email: true } } },
    })

    if (!ticket) {
      const res = NextResponse.json(
        { error: 'NOT_FOUND', message: 'Atendimento não encontrado.', requestId },
        { status: 404 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const res = NextResponse.json({ data: ticket })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    console.log({ requestId, method: 'GET', path: `/api/admin/tickets/${id}`, status: 200, durationMs: Date.now() - start })
    return res

  } catch (err) {
    const res = NextResponse.json(
      { error: 'INTERNAL', message: 'Erro interno.', requestId },
      { status: 500 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    return res
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const session = await auth()
    const role = session?.user?.role as UserRole | undefined

    if (!session || !role || !ROLES_PERMITIDOS.includes(role)) {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso negado.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const { id } = await params

    const ticket = await prisma.atendimento.findUnique({ where: { id } })
    if (!ticket) {
      const res = NextResponse.json(
        { error: 'NOT_FOUND', message: 'Atendimento não encontrado.', requestId },
        { status: 404 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const body = await req.json()
    const data = patchSchema.parse(body)

    const updateData: Record<string, unknown> = {}

    if (data.resposta) {
      const novaEntrada: HistoricoItem = {
        de: session.user.name ?? 'Atendente',
        texto: data.resposta.texto,
        criadoEm: new Date().toISOString(),
      }
      const historicoAtual = (ticket.historico ?? []) as unknown as HistoricoItem[]
      updateData.historico = [...historicoAtual, novaEntrada] as unknown as Prisma.InputJsonValue[]
    }

    // #70 — Status auto: status explícito do body sempre vence;
    // sem status explícito + nova resposta + ticket ABERTO → progride
    // automaticamente para EM_ATENDIMENTO.
    if (data.status) {
      updateData.status = data.status
    } else if (data.resposta && ticket.status === 'ABERTO') {
      updateData.status = 'EM_ATENDIMENTO'
    }

    const updated = await prisma.atendimento.update({
      where: { id },
      data: updateData,
    })

    if (data.resposta) {
      try {
        await enqueueEmail({
          to: updated.emailContato,
          template: 'atendimento_respondido',
          data: {
            nomeContato: updated.nomeContato,
            protocolo: updated.protocolo,
            assunto: updated.assunto,
            resposta: data.resposta.texto,
          },
        })
      } catch (err) {
        console.error({ requestId, message: 'Falha ao enfileirar e-mail de resposta de atendimento', err })
      }
    }

    const res = NextResponse.json({ data: updated })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    console.log({ requestId, method: 'PATCH', path: `/api/admin/tickets/${id}`, status: 200, durationMs: Date.now() - start })
    return res

  } catch (err) {
    const res = NextResponse.json(
      { error: 'BAD_REQUEST', message: 'Dados inválidos.', requestId },
      { status: 400 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    return res
  }
}
