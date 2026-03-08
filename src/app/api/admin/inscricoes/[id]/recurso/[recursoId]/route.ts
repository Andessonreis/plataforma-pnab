import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'
import { enqueueEmail } from '@/lib/queue'

export const runtime = 'nodejs'

const decisaoSchema = z.object({
  decisao: z.enum(['DEFERIDO', 'INDEFERIDO']),
  justificativa: z.string().min(10, 'Justificativa deve ter no mínimo 10 caracteres'),
})

// PATCH — Decidir recurso
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; recursoId: string }> },
) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const session = await auth()
    if (!session || !['ADMIN', 'HABILITADOR'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso negado.', requestId },
        { status: 403 },
      )
    }

    const { id, recursoId } = await params
    const body = await req.json()
    const data = decisaoSchema.parse(body)

    const recurso = await prisma.recurso.findUnique({
      where: { id: recursoId },
      include: {
        inscricao: {
          include: {
            proponente: { select: { email: true, nome: true } },
            edital: { select: { titulo: true, slug: true } },
          },
        },
      },
    })

    if (!recurso || recurso.inscricaoId !== id) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Recurso não encontrado.', requestId },
        { status: 404 },
      )
    }

    if (recurso.decisao) {
      return NextResponse.json(
        { error: 'CONFLICT', message: 'Este recurso já foi decidido.', requestId },
        { status: 409 },
      )
    }

    // Atualiza recurso
    await prisma.recurso.update({
      where: { id: recursoId },
      data: {
        decisao: data.decisao,
        justificativa: data.justificativa,
        decidedAt: new Date(),
      },
    })

    // Atualiza status da inscrição conforme decisão
    let newStatus: string
    if (data.decisao === 'DEFERIDO') {
      // Recurso deferido: restaura status anterior (habilitada ou mantém avaliação)
      if (recurso.fase === 'HABILITACAO') {
        newStatus = 'HABILITADA'
      } else {
        newStatus = 'RESULTADO_PRELIMINAR'
      }
    } else {
      // Indeferido: mantém status anterior
      if (recurso.fase === 'HABILITACAO') {
        newStatus = 'INABILITADA'
      } else if (recurso.fase === 'RESULTADO_FINAL') {
        newStatus = 'NAO_CONTEMPLADA'
      } else {
        newStatus = 'RESULTADO_PRELIMINAR'
      }
    }

    await prisma.inscricao.update({
      where: { id },
      data: { status: newStatus as 'HABILITADA' | 'INABILITADA' | 'RESULTADO_PRELIMINAR' | 'NAO_CONTEMPLADA' },
    })

    // Notifica proponente por e-mail
    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
    await enqueueEmail({
      to: recurso.inscricao.proponente.email,
      subject: `Recurso ${data.decisao === 'DEFERIDO' ? 'Deferido' : 'Indeferido'} — ${recurso.inscricao.edital.titulo}`,
      template: 'resultado_final',
      data: {
        edital: recurso.inscricao.edital.titulo,
        url: `${baseUrl}/proponente/inscricoes/${id}`,
      },
    })

    await logAudit({
      userId: session.user.id,
      action: AUDIT_ACTIONS.RECURSO_DECIDIDO,
      entity: 'Recurso',
      entityId: recursoId,
      details: { inscricaoId: id, decisao: data.decisao, fase: recurso.fase },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const res = NextResponse.json({
      message: `Recurso ${data.decisao === 'DEFERIDO' ? 'deferido' : 'indeferido'}.`,
      requestId,
    })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    console.log({ requestId, method: 'PATCH', path: `/api/admin/inscricoes/${id}/recurso/${recursoId}`, status: 200, durationMs: Date.now() - start })
    return res
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: err.errors[0].message, requestId },
        { status: 400 },
      )
    }
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro ao decidir recurso.', requestId },
      { status: 500 },
    )
  }
}
