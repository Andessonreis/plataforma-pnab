import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { auth } from '@server/lib/auth'
import { prisma } from '@server/lib/db'
import { logAudit } from '@server/lib/audit'
import { generateTipoSlug } from '@shared/utils/slug'

export const runtime = 'nodejs'

const createSchema = z.object({
  label: z.string().min(1, 'Label é obrigatório'),
  obrigatorio: z.boolean().default(false),
  tag: z.string().min(1, 'Tag é obrigatória'),
})

// -- GET — Listar tipos de anexo (com filtro opcional por tag) ----------------

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
    const tagFilter = searchParams.get('tag')

    const where = tagFilter ? { tag: tagFilter } : {}

    const [tipos, tagsRaw] = await Promise.all([
      prisma.attachmentType.findMany({
        where,
        orderBy: [{ tag: 'asc' }, { isSystem: 'desc' }, { label: 'asc' }],
      }),
      prisma.attachmentType.findMany({
        select: { tag: true },
        distinct: ['tag'],
        orderBy: { tag: 'asc' },
      }),
    ])

    const tags = tagsRaw.map(t => t.tag)

    const res = NextResponse.json({ data: tipos, tags, requestId })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'GET',
      path: '/api/admin/configuracoes/tipos-anexo',
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

// -- POST — Criar tipo de anexo -----------------------------------------------

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

    // Gerar tipo (UPPER_SNAKE_CASE) a partir do label
    let tipoSlug = generateTipoSlug(data.label)
    const existing = await prisma.attachmentType.findFirst({ where: { tipo: tipoSlug } })
    if (existing) {
      // Buscar todos que começam com o mesmo slug para gerar sufixo
      const similares = await prisma.attachmentType.findMany({
        where: { tipo: { startsWith: tipoSlug } },
        select: { tipo: true },
      })
      const usados = new Set(similares.map(s => s.tipo))
      let suffix = 2
      while (usados.has(`${tipoSlug}_${suffix}`)) suffix++
      tipoSlug = `${tipoSlug}_${suffix}`
    }

    const tipo = await prisma.attachmentType.create({
      data: {
        tipo: tipoSlug,
        label: data.label,
        obrigatorio: data.obrigatorio,
        tag: data.tag,
        isSystem: false,
      },
    })

    await logAudit({
      userId: session.user.id,
      action: 'TIPO_ANEXO_CRIADO',
      entity: 'AttachmentType',
      entityId: tipo.id,
      details: { tipo: tipo.tipo, label: tipo.label, tag: tipo.tag },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const res = NextResponse.json(
      { message: 'Tipo de anexo criado com sucesso.', id: tipo.id, requestId },
      { status: 201 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'POST',
      path: '/api/admin/configuracoes/tipos-anexo',
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
