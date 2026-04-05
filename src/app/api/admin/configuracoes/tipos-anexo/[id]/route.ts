import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'

export const runtime = 'nodejs'

const updateSchema = z.object({
  label: z.string().min(1, 'Label é obrigatório'),
  obrigatorio: z.boolean().default(false),
  tag: z.string().min(1, 'Tag é obrigatória'),
})

type RouteContext = { params: Promise<{ id: string }> }

// -- GET — Buscar tipo por ID ------------------------------------------------

export async function GET(req: NextRequest, ctx: RouteContext) {
  const requestId = randomUUID()
  const { id } = await ctx.params

  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso negado.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const tipo = await prisma.attachmentType.findUnique({ where: { id } })
    if (!tipo) {
      const res = NextResponse.json(
        { error: 'NOT_FOUND', message: 'Tipo de anexo não encontrado.', requestId },
        { status: 404 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const res = NextResponse.json({ data: tipo, requestId })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (err) {
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

// -- PUT — Atualizar tipo -----------------------------------------------------

export async function PUT(req: NextRequest, ctx: RouteContext) {
  const requestId = randomUUID()
  const start = Date.now()
  const { id } = await ctx.params

  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso negado.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const existing = await prisma.attachmentType.findUnique({ where: { id } })
    if (!existing) {
      const res = NextResponse.json(
        { error: 'NOT_FOUND', message: 'Tipo de anexo não encontrado.', requestId },
        { status: 404 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const body = await req.json()
    const data = updateSchema.parse(body)

    // Tipos do sistema: só permite alterar label e obrigatório
    // O campo `tipo` nunca muda na edição (gerado automaticamente na criação)
    const tipo = await prisma.attachmentType.update({
      where: { id },
      data: existing.isSystem
        ? { label: data.label, obrigatorio: data.obrigatorio }
        : { label: data.label, obrigatorio: data.obrigatorio, tag: data.tag },
    })

    await logAudit({
      userId: session.user.id,
      action: 'TIPO_ANEXO_ATUALIZADO',
      entity: 'AttachmentType',
      entityId: tipo.id,
      details: { tipo: tipo.tipo, label: tipo.label, tag: tipo.tag },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const res = NextResponse.json(
      { message: 'Tipo de anexo atualizado.', id: tipo.id, requestId },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'PUT',
      path: `/api/admin/configuracoes/tipos-anexo/${id}`,
      status: 200,
      durationMs: Date.now() - start,
    })

    return res
  } catch (err) {
    if (err instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {}
      for (const e of err.errors) {
        fieldErrors[e.path.join('.')] = e.message
      }
      const res = NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Dados inválidos.', fieldErrors, requestId },
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

// -- DELETE — Excluir tipo ----------------------------------------------------

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const requestId = randomUUID()
  const start = Date.now()
  const { id } = await ctx.params

  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso negado.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const existing = await prisma.attachmentType.findUnique({ where: { id } })
    if (!existing) {
      const res = NextResponse.json(
        { error: 'NOT_FOUND', message: 'Tipo de anexo não encontrado.', requestId },
        { status: 404 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    if (existing.isSystem) {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'Tipos do sistema não podem ser excluídos.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    await prisma.attachmentType.delete({ where: { id } })

    await logAudit({
      userId: session.user.id,
      action: 'TIPO_ANEXO_EXCLUIDO',
      entity: 'AttachmentType',
      entityId: id,
      details: { tipo: existing.tipo, label: existing.label, tag: existing.tag },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const res = NextResponse.json(
      { message: 'Tipo de anexo excluído.', requestId },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'DELETE',
      path: `/api/admin/configuracoes/tipos-anexo/${id}`,
      status: 200,
      durationMs: Date.now() - start,
    })

    return res
  } catch (err) {
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
