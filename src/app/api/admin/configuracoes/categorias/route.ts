import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { generateSimpleSlug } from '@/lib/utils/slug'

export const runtime = 'nodejs'

const createSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100),
  descricao: z.string().max(500).optional(),
})

// -- GET — Listar categorias ordenadas por `ordem` ----------------------------

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url)
    const includeInactive = searchParams.get('all') === 'true'

    const where = includeInactive ? {} : { ativa: true }

    const categorias = await prisma.category.findMany({
      where,
      orderBy: { ordem: 'asc' },
    })

    const res = NextResponse.json({ data: categorias, requestId })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'GET',
      path: '/api/admin/configuracoes/categorias',
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

// -- POST — Criar categoria ---------------------------------------------------

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
    const data = createSchema.parse(body)

    // Gerar slug a partir do nome
    let slug = generateSimpleSlug(data.nome)
    const existingSlug = await prisma.category.findFirst({ where: { slug } })
    if (existingSlug) {
      const similares = await prisma.category.findMany({
        where: { slug: { startsWith: slug } },
        select: { slug: true },
      })
      const usados = new Set(similares.map(s => s.slug))
      let suffix = 2
      while (usados.has(`${slug}-${suffix}`)) suffix++
      slug = `${slug}-${suffix}`
    }

    // Verificar nome duplicado
    const existingNome = await prisma.category.findFirst({ where: { nome: data.nome.trim() } })
    if (existingNome) {
      const res = NextResponse.json(
        { error: 'CONFLICT', message: 'Já existe uma categoria com este nome.', requestId },
        { status: 409 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // Calcular próxima ordem
    const lastCategory = await prisma.category.findFirst({ orderBy: { ordem: 'desc' } })
    const nextOrdem = (lastCategory?.ordem ?? 0) + 10

    const categoria = await prisma.category.create({
      data: {
        nome: data.nome.trim(),
        slug,
        descricao: data.descricao?.trim() || null,
        ativa: true,
        isSystem: false,
        ordem: nextOrdem,
      },
    })

    await logAudit({
      userId: session.user.id,
      action: 'CATEGORIA_CRIADA',
      entity: 'Category',
      entityId: categoria.id,
      details: { nome: categoria.nome, slug: categoria.slug },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const res = NextResponse.json(
      { message: 'Categoria criada com sucesso.', id: categoria.id, requestId },
      { status: 201 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'POST',
      path: '/api/admin/configuracoes/categorias',
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
