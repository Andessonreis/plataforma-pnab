import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'

export const runtime = 'nodejs'

// -- Schema de validacao ------------------------------------------------------

const cmsPageSchema = z.object({
  titulo: z.string().min(3, 'Titulo deve ter no minimo 3 caracteres'),
  corpo: z.string().min(1, 'Conteudo e obrigatorio'),
  publicado: z.boolean().default(false),
})

// -- Gerar slug a partir do titulo --------------------------------------------

function generateSlug(titulo: string): string {
  return titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// -- POST — Criar pagina CMS -------------------------------------------------

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
    const data = cmsPageSchema.parse(body)

    // Gerar slug unico
    let slug = generateSlug(data.titulo)
    const existingSlug = await prisma.cmsPage.findUnique({ where: { slug } })
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`
    }

    const page = await prisma.cmsPage.create({
      data: {
        titulo: data.titulo,
        slug,
        corpo: data.corpo,
        publicado: data.publicado,
      },
    })

    await logAudit({
      userId: session.user.id,
      action: 'CMS_PAGINA_CRIADA',
      entity: 'CmsPage',
      entityId: page.id,
      details: { titulo: page.titulo, slug: page.slug },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const res = NextResponse.json(
      { message: 'Pagina criada com sucesso.', id: page.id, slug: page.slug, requestId },
      { status: 201 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'POST',
      path: '/api/admin/cms',
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

// -- PUT — Atualizar pagina CMS ----------------------------------------------

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
        { error: 'BAD_REQUEST', message: 'ID da pagina e obrigatorio.', requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const existing = await prisma.cmsPage.findUnique({ where: { id } })
    if (!existing) {
      const res = NextResponse.json(
        { error: 'NOT_FOUND', message: 'Pagina nao encontrada.', requestId },
        { status: 404 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const body = await req.json()
    const data = cmsPageSchema.parse(body)

    // Regenerar slug se titulo mudou
    let slug = existing.slug
    if (data.titulo !== existing.titulo) {
      slug = generateSlug(data.titulo)
      const slugExists = await prisma.cmsPage.findFirst({
        where: { slug, id: { not: id } },
      })
      if (slugExists) {
        slug = `${slug}-${Date.now().toString(36)}`
      }
    }

    const page = await prisma.cmsPage.update({
      where: { id },
      data: {
        titulo: data.titulo,
        slug,
        corpo: data.corpo,
        publicado: data.publicado,
      },
    })

    await logAudit({
      userId: session.user.id,
      action: 'CMS_PAGINA_ATUALIZADA',
      entity: 'CmsPage',
      entityId: page.id,
      details: { titulo: page.titulo, slug: page.slug, publicado: page.publicado },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const res = NextResponse.json(
      { message: 'Pagina atualizada.', id: page.id, slug: page.slug, requestId },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'PUT',
      path: '/api/admin/cms',
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
