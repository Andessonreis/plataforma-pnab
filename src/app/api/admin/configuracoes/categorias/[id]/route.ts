import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'

export const runtime = 'nodejs'

const updateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100).optional(),
  descricao: z.string().max(500).nullable().optional(),
  ativa: z.boolean().optional(),
})

type RouteContext = { params: Promise<{ id: string }> }

// -- GET — Buscar categoria por ID --------------------------------------------

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

    const categoria = await prisma.category.findUnique({ where: { id } })
    if (!categoria) {
      const res = NextResponse.json(
        { error: 'NOT_FOUND', message: 'Categoria não encontrada.', requestId },
        { status: 404 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const res = NextResponse.json({ data: categoria, requestId })
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

// -- PUT — Atualizar categoria ------------------------------------------------

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

    const existing = await prisma.category.findUnique({ where: { id } })
    if (!existing) {
      const res = NextResponse.json(
        { error: 'NOT_FOUND', message: 'Categoria não encontrada.', requestId },
        { status: 404 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const body = await req.json()
    const data = updateSchema.parse(body)

    // isSystem: nome/slug bloqueados, só descricao e ativa editáveis
    const updateData: Record<string, unknown> = {}

    if (existing.isSystem) {
      if (data.descricao !== undefined) updateData.descricao = data.descricao?.trim() || null
      if (data.ativa !== undefined) updateData.ativa = data.ativa
    } else {
      if (data.nome !== undefined) {
        const trimmedNome = data.nome.trim()
        // Verificar nome duplicado (excluindo o próprio)
        const dup = await prisma.category.findFirst({
          where: { nome: trimmedNome, id: { not: id } },
        })
        if (dup) {
          const res = NextResponse.json(
            { error: 'CONFLICT', message: 'Já existe uma categoria com este nome.', requestId },
            { status: 409 },
          )
          res.headers.set('X-Request-Id', requestId)
          res.headers.set('Cache-Control', 'no-store')
          return res
        }
        updateData.nome = trimmedNome
      }
      if (data.descricao !== undefined) updateData.descricao = data.descricao?.trim() || null
      if (data.ativa !== undefined) updateData.ativa = data.ativa
    }

    const categoria = await prisma.category.update({
      where: { id },
      data: updateData,
    })

    await logAudit({
      userId: session.user.id,
      action: 'CATEGORIA_ATUALIZADA',
      entity: 'Category',
      entityId: categoria.id,
      details: { nome: categoria.nome, changes: Object.keys(updateData) },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const res = NextResponse.json(
      { message: 'Categoria atualizada.', id: categoria.id, requestId },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'PUT',
      path: `/api/admin/configuracoes/categorias/${id}`,
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

// -- DELETE — Excluir categoria -----------------------------------------------

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

    const existing = await prisma.category.findUnique({ where: { id } })
    if (!existing) {
      const res = NextResponse.json(
        { error: 'NOT_FOUND', message: 'Categoria não encontrada.', requestId },
        { status: 404 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    if (existing.isSystem) {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'Categorias do sistema não podem ser excluídas.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    await prisma.category.delete({ where: { id } })

    await logAudit({
      userId: session.user.id,
      action: 'CATEGORIA_EXCLUIDA',
      entity: 'Category',
      entityId: id,
      details: { nome: existing.nome, slug: existing.slug },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const res = NextResponse.json(
      { message: 'Categoria excluída.', requestId },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'DELETE',
      path: `/api/admin/configuracoes/categorias/${id}`,
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
