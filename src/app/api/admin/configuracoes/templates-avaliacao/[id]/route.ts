import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { auth } from '@server/lib/auth'
import { prisma } from '@server/lib/db'
import { logAudit } from '@server/lib/audit'

export const runtime = 'nodejs'

const criterioSchema = z.object({
  criterio: z.string().min(1),
  peso: z.number().min(0),
  descricao: z.string().optional(),
  notaMax: z.number().min(0),
  bloco: z.string().optional(),
  modo: z.enum(['slider', 'discreto']).optional(),
  naoAtende: z.number().min(0).optional(),
  parcial: z.number().min(0).optional(),
  plenamente: z.number().min(0).optional(),
})

const updateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(200).optional(),
  descricao: z.string().max(1000).nullable().optional(),
  criterios: z.array(criterioSchema).min(1).optional(),
  formula: z.string().max(200).nullable().optional(),
  ativo: z.boolean().optional(),
})

type RouteContext = { params: Promise<{ id: string }> }

// -- GET — Buscar template por ID ---------------------------------------------

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

    const template = await prisma.evaluationTemplate.findUnique({ where: { id } })
    if (!template) {
      const res = NextResponse.json(
        { error: 'NOT_FOUND', message: 'Template não encontrado.', requestId },
        { status: 404 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const res = NextResponse.json({ data: template, requestId })
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

// -- PUT — Atualizar template -------------------------------------------------

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

    const existing = await prisma.evaluationTemplate.findUnique({ where: { id } })
    if (!existing) {
      const res = NextResponse.json(
        { error: 'NOT_FOUND', message: 'Template não encontrado.', requestId },
        { status: 404 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const body = await req.json()
    const data = updateSchema.parse(body)

    const updateData: Record<string, unknown> = {}

    if (existing.isSystem) {
      // isSystem: nome bloqueado, só descricao, criterios, formula e ativo editáveis
      if (data.descricao !== undefined) updateData.descricao = data.descricao?.trim() || null
      if (data.criterios !== undefined) updateData.criterios = data.criterios
      if (data.formula !== undefined) updateData.formula = data.formula?.trim() || null
      if (data.ativo !== undefined) updateData.ativo = data.ativo
    } else {
      if (data.nome !== undefined) {
        const trimmedNome = data.nome.trim()
        const dup = await prisma.evaluationTemplate.findFirst({
          where: { nome: trimmedNome, id: { not: id } },
        })
        if (dup) {
          const res = NextResponse.json(
            { error: 'CONFLICT', message: 'Já existe um template com este nome.', requestId },
            { status: 409 },
          )
          res.headers.set('X-Request-Id', requestId)
          res.headers.set('Cache-Control', 'no-store')
          return res
        }
        updateData.nome = trimmedNome
      }
      if (data.descricao !== undefined) updateData.descricao = data.descricao?.trim() || null
      if (data.criterios !== undefined) updateData.criterios = data.criterios
      if (data.formula !== undefined) updateData.formula = data.formula?.trim() || null
      if (data.ativo !== undefined) updateData.ativo = data.ativo
    }

    const template = await prisma.evaluationTemplate.update({
      where: { id },
      data: updateData,
    })

    await logAudit({
      userId: session.user.id,
      action: 'TEMPLATE_AVALIACAO_ATUALIZADO',
      entity: 'EvaluationTemplate',
      entityId: template.id,
      details: { nome: template.nome, changes: Object.keys(updateData) },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const res = NextResponse.json(
      { message: 'Template atualizado.', id: template.id, requestId },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'PUT',
      path: `/api/admin/configuracoes/templates-avaliacao/${id}`,
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

// -- DELETE — Excluir template ------------------------------------------------

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

    const existing = await prisma.evaluationTemplate.findUnique({ where: { id } })
    if (!existing) {
      const res = NextResponse.json(
        { error: 'NOT_FOUND', message: 'Template não encontrado.', requestId },
        { status: 404 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    if (existing.isSystem) {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'Templates do sistema não podem ser excluídos.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    await prisma.evaluationTemplate.delete({ where: { id } })

    await logAudit({
      userId: session.user.id,
      action: 'TEMPLATE_AVALIACAO_EXCLUIDO',
      entity: 'EvaluationTemplate',
      entityId: id,
      details: { nome: existing.nome },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const res = NextResponse.json(
      { message: 'Template excluído.', requestId },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'DELETE',
      path: `/api/admin/configuracoes/templates-avaliacao/${id}`,
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
