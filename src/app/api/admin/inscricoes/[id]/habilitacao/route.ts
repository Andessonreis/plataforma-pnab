import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import type { UserRole } from '@prisma/client'

export const runtime = 'nodejs'

const habilitacaoSchema = z.object({
  status: z.enum(['HABILITADA', 'INABILITADA']),
  motivo: z.string().optional(),
}).refine(
  (data) => {
    if (data.status === 'INABILITADA' && (!data.motivo || !data.motivo.trim())) {
      return false
    }
    return true
  },
  { message: 'Motivo e obrigatorio para inabilitacao.', path: ['motivo'] },
)

const ROLES_PERMITIDOS: UserRole[] = ['ADMIN', 'HABILITADOR']

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const session = await auth()
    if (!session || !ROLES_PERMITIDOS.includes(session.user.role as UserRole)) {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso negado.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const { id } = await params

    const inscricao = await prisma.inscricao.findUnique({
      where: { id },
      select: { id: true, numero: true, status: true },
    })

    if (!inscricao) {
      const res = NextResponse.json(
        { error: 'NOT_FOUND', message: 'Inscricao nao encontrada.', requestId },
        { status: 404 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const body = await req.json()
    const data = habilitacaoSchema.parse(body)

    const updateData: Record<string, unknown> = {
      status: data.status,
    }

    if (data.status === 'INABILITADA') {
      updateData.motivoInabilitacao = data.motivo
    } else {
      updateData.motivoInabilitacao = null
    }

    await prisma.inscricao.update({
      where: { id },
      data: updateData,
    })

    await logAudit({
      userId: session.user.id,
      action: data.status === 'HABILITADA' ? 'INSCRICAO_HABILITADA' : 'INSCRICAO_INABILITADA',
      entity: 'Inscricao',
      entityId: id,
      details: {
        numero: inscricao.numero,
        statusAnterior: inscricao.status,
        novoStatus: data.status,
        motivo: data.motivo ?? null,
      },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const res = NextResponse.json({
      message: `Inscricao ${data.status === 'HABILITADA' ? 'habilitada' : 'inabilitada'} com sucesso.`,
      requestId,
    })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'PUT',
      path: `/api/admin/inscricoes/${id}/habilitacao`,
      status: 200,
      durationMs: Date.now() - start,
    })

    return res
  } catch (err) {
    if (err instanceof z.ZodError) {
      const res = NextResponse.json(
        { error: 'VALIDATION_ERROR', message: err.errors[0].message, requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })

    const res = NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro interno.', requestId },
      { status: 500 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  }
}
