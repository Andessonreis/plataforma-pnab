import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'

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

const createSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(200),
  descricao: z.string().max(1000).optional(),
  criterios: z.array(criterioSchema).min(1, 'Pelo menos um critério é obrigatório'),
  formula: z.string().max(200).optional(),
})

// -- GET — Listar templates ordenados por `ordem` -----------------------------

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

    const where = includeInactive ? {} : { ativo: true }

    const templates = await prisma.evaluationTemplate.findMany({
      where,
      orderBy: { ordem: 'asc' },
    })

    const res = NextResponse.json({ data: templates, requestId })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'GET',
      path: '/api/admin/configuracoes/templates-avaliacao',
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

// -- POST — Criar template ----------------------------------------------------

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

    // Verificar nome duplicado
    const existingNome = await prisma.evaluationTemplate.findFirst({
      where: { nome: data.nome.trim() },
    })
    if (existingNome) {
      const res = NextResponse.json(
        { error: 'CONFLICT', message: 'Já existe um template com este nome.', requestId },
        { status: 409 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // Calcular próxima ordem
    const last = await prisma.evaluationTemplate.findFirst({ orderBy: { ordem: 'desc' } })
    const nextOrdem = (last?.ordem ?? 0) + 10

    const template = await prisma.evaluationTemplate.create({
      data: {
        nome: data.nome.trim(),
        descricao: data.descricao?.trim() || null,
        criterios: data.criterios,
        formula: data.formula?.trim() || null,
        isSystem: false,
        ativo: true,
        ordem: nextOrdem,
      },
    })

    await logAudit({
      userId: session.user.id,
      action: 'TEMPLATE_AVALIACAO_CRIADO',
      entity: 'EvaluationTemplate',
      entityId: template.id,
      details: { nome: template.nome, criteriosCount: data.criterios.length },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const res = NextResponse.json(
      { message: 'Template criado com sucesso.', id: template.id, requestId },
      { status: 201 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'POST',
      path: '/api/admin/configuracoes/templates-avaliacao',
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
