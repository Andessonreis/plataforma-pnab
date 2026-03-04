import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'

export const runtime = 'nodejs'

// ── Schema de validacao ─────────────────────────────────────────────────────

const cronogramaItemSchema = z.object({
  label: z.string().min(1, 'Descrição do marco é obrigatória'),
  dataHora: z.string().default(''),
  destaque: z.boolean().default(false),
})

const editalSchema = z.object({
  titulo: z.string().min(3, 'Titulo deve ter no minimo 3 caracteres'),
  resumo: z.string().nullable().optional(),
  ano: z.number().int().min(2020).max(2099),
  valorTotal: z.number().nullable().optional(),
  categorias: z.array(z.string()).default([]),
  acoesAfirmativas: z.string().nullable().optional(),
  regrasElegibilidade: z.string().nullable().optional(),
  status: z.enum([
    'RASCUNHO', 'PUBLICADO', 'INSCRICOES_ABERTAS', 'INSCRICOES_ENCERRADAS',
    'HABILITACAO', 'AVALIACAO', 'RESULTADO_PRELIMINAR', 'RECURSO',
    'RESULTADO_FINAL', 'ENCERRADO',
  ]).default('RASCUNHO'),
  cronograma: z.array(cronogramaItemSchema).default([]),
  camposFormulario: z.array(z.record(z.string(), z.unknown())).default([]),
})

// ── Gerar slug a partir do titulo ───────────────────────────────────────────

function generateSlug(titulo: string, ano: number): string {
  const base = titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  return `${base}-${ano}`
}

// ── POST — Criar edital ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const requestId = randomUUID()
  const start = Date.now()

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

    const body = await req.json()
    const data = editalSchema.parse(body)

    // Gerar slug unico
    let slug = generateSlug(data.titulo, data.ano)
    const existingSlug = await prisma.edital.findUnique({ where: { slug } })
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`
    }

    const edital = await prisma.edital.create({
      data: {
        titulo: data.titulo,
        slug,
        ano: data.ano,
        status: data.status,
        resumo: data.resumo ?? null,
        valorTotal: data.valorTotal ?? null,
        categorias: data.categorias,
        acoesAfirmativas: data.acoesAfirmativas ?? null,
        regrasElegibilidade: data.regrasElegibilidade ?? null,
        cronograma: data.cronograma,
        camposFormulario: data.camposFormulario as unknown as import('@prisma/client').Prisma.InputJsonValue,
      },
    })

    await logAudit({
      userId: session.user.id,
      action: 'EDITAL_CRIADO',
      entity: 'Edital',
      entityId: edital.id,
      details: { titulo: edital.titulo, status: edital.status },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const res = NextResponse.json(
      { message: 'Edital criado com sucesso.', id: edital.id, slug: edital.slug, requestId },
      { status: 201 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'POST',
      path: '/api/admin/editais',
      status: 201,
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
        { error: 'VALIDATION_ERROR', message: 'Dados invalidos.', fieldErrors, requestId },
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

// ── PUT — Atualizar edital ──────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  const requestId = randomUUID()
  const start = Date.now()

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

    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) {
      const res = NextResponse.json(
        { error: 'BAD_REQUEST', message: 'ID do edital e obrigatorio.', requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const existing = await prisma.edital.findUnique({ where: { id } })
    if (!existing) {
      const res = NextResponse.json(
        { error: 'NOT_FOUND', message: 'Edital nao encontrado.', requestId },
        { status: 404 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const body = await req.json()
    const data = editalSchema.parse(body)

    // Regenerar slug se titulo mudou
    let slug = existing.slug
    if (data.titulo !== existing.titulo) {
      slug = generateSlug(data.titulo, data.ano)
      const slugExists = await prisma.edital.findFirst({
        where: { slug, id: { not: id } },
      })
      if (slugExists) {
        slug = `${slug}-${Date.now().toString(36)}`
      }
    }

    const edital = await prisma.edital.update({
      where: { id },
      data: {
        titulo: data.titulo,
        slug,
        ano: data.ano,
        status: data.status,
        resumo: data.resumo ?? null,
        valorTotal: data.valorTotal ?? null,
        categorias: data.categorias,
        acoesAfirmativas: data.acoesAfirmativas ?? null,
        regrasElegibilidade: data.regrasElegibilidade ?? null,
        cronograma: data.cronograma,
        camposFormulario: data.camposFormulario as unknown as import('@prisma/client').Prisma.InputJsonValue,
      },
    })

    await logAudit({
      userId: session.user.id,
      action: 'EDITAL_ATUALIZADO',
      entity: 'Edital',
      entityId: edital.id,
      details: { titulo: edital.titulo, status: edital.status },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const res = NextResponse.json(
      { message: 'Edital atualizado.', id: edital.id, slug: edital.slug, requestId },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'PUT',
      path: '/api/admin/editais',
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
        { error: 'VALIDATION_ERROR', message: 'Dados invalidos.', fieldErrors, requestId },
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
