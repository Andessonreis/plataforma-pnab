import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'

export const runtime = 'nodejs'

// -- Schema de validacao -------------------------------------------------------

const faqSchema = z.object({
  pergunta: z.string().min(5, 'Pergunta deve ter no minimo 5 caracteres'),
  resposta: z.string().min(5, 'Resposta deve ter no minimo 5 caracteres'),
  editalId: z.string().nullable().optional(),
  ordem: z.number().int().default(0),
  publicado: z.boolean().default(true),
})

// -- POST — Criar item FAQ ----------------------------------------------------

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
    const data = faqSchema.parse(body)

    const faqItem = await prisma.faqItem.create({
      data: {
        pergunta: data.pergunta,
        resposta: data.resposta,
        editalId: data.editalId ?? null,
        ordem: data.ordem,
        publicado: data.publicado,
      },
    })

    await logAudit({
      userId: session.user.id,
      action: 'FAQ_CRIADO',
      entity: 'FaqItem',
      entityId: faqItem.id,
      details: { pergunta: faqItem.pergunta, publicado: faqItem.publicado },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const res = NextResponse.json(
      { message: 'Item de FAQ criado com sucesso.', id: faqItem.id, requestId },
      { status: 201 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'POST',
      path: '/api/admin/faq',
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

// -- PUT — Atualizar item FAQ --------------------------------------------------

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
        { error: 'BAD_REQUEST', message: 'ID do item e obrigatorio.', requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const existing = await prisma.faqItem.findUnique({ where: { id } })
    if (!existing) {
      const res = NextResponse.json(
        { error: 'NOT_FOUND', message: 'Item de FAQ nao encontrado.', requestId },
        { status: 404 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const body = await req.json()
    const data = faqSchema.parse(body)

    const faqItem = await prisma.faqItem.update({
      where: { id },
      data: {
        pergunta: data.pergunta,
        resposta: data.resposta,
        editalId: data.editalId ?? null,
        ordem: data.ordem,
        publicado: data.publicado,
      },
    })

    await logAudit({
      userId: session.user.id,
      action: 'FAQ_ATUALIZADO',
      entity: 'FaqItem',
      entityId: faqItem.id,
      details: { pergunta: faqItem.pergunta, publicado: faqItem.publicado },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const res = NextResponse.json(
      { message: 'Item de FAQ atualizado.', id: faqItem.id, requestId },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'PUT',
      path: '/api/admin/faq',
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
