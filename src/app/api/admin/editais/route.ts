import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { auth } from '@server/lib/auth'
import { prisma } from '@server/lib/db'
import { logAudit } from '@/lib/audit'
import { validateCronogramaOrderServer } from '@/lib/utils/cronograma'

export const runtime = 'nodejs'

// ── Schema de validacao ─────────────────────────────────────────────────────

const cronogramaFaseSchema = z.object({
  tipo: z.literal('fase'),
  fase: z.enum([
    'PUBLICADO', 'INSCRICOES_ABERTAS', 'INSCRICOES_ENCERRADAS',
    'HABILITACAO', 'AVALIACAO', 'RESULTADO_PRELIMINAR', 'RECURSO',
    'RESULTADO_FINAL', 'ENCERRADO',
  ]),
  dataHora: z.string().default(''),
})

const cronogramaCustomSchema = z.object({
  tipo: z.literal('custom'),
  label: z.string().min(1, 'Descrição do marco é obrigatória'),
  dataHora: z.string().default(''),
})

// Aceita formato novo (discriminated union) E formato legado (sem tipo)
const cronogramaLegacySchema = z.object({
  label: z.string().min(1),
  dataHora: z.string().default(''),
})

const cronogramaItemSchema = z.union([
  cronogramaFaseSchema,
  cronogramaCustomSchema,
  cronogramaLegacySchema,
])

const editalSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
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
  cronograma: z.array(cronogramaItemSchema).default([]).superRefine((items, ctx) => {
    const errors = validateCronogramaOrderServer(items as import('@/types/cronograma').CronogramaItem[])
    for (const msg of errors) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: msg, path: [] })
    }
  }),
  camposFormulario: z.array(z.record(z.string(), z.unknown())).default([]),
  etapasCustomizadas: z.array(z.object({
    id: z.string()
      .min(1, 'Identificador da etapa é obrigatório')
      .regex(/^[a-z0-9_-]+$/, 'ID só pode conter letras minúsculas, números, hífen ou underline'),
    titulo: z.string().min(1, 'Título da etapa é obrigatório').max(120),
    descricao: z.string().max(2000).optional(),
    ordem: z.number().int().min(0),
    campos: z.array(z.record(z.string(), z.unknown())).default([]),
  })).default([]).superRefine((etapas, ctx) => {
    const ids = etapas.map(e => e.id)
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
    if (dupes.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `IDs de etapas duplicados: ${[...new Set(dupes)].join(', ')}`,
        path: [],
      })
    }
  }),
  vagasContemplados: z.number().int().min(1).nullable().optional(),
  vagasSuplentes: z.number().int().min(0).nullable().optional(),
  criteriosAvaliacao: z.array(z.object({
    criterio: z.string().min(1),
    peso: z.number().min(0),
    notaMax: z.number().min(0),
    descricao: z.string().optional(),
    bloco: z.string().optional(),
    modo: z.enum(['slider', 'discreto']).optional(),
    naoAtende: z.number().min(0).optional(),
    parcial: z.number().min(0).optional(),
    plenamente: z.number().min(0).optional(),
  })).nullable().optional(),
  formulaAvaliacao: z.string().max(200).nullable().optional(),
  tiposAnexo: z.array(z.object({
    tipo: z.string().min(1),
    label: z.string().min(1),
    obrigatorio: z.boolean().default(false),
  })).nullable().optional(),
  notaMinima: z.number().min(0).nullable().optional(),
  desempate: z.array(z.object({
    descricao: z.string().min(1),
    tipo: z.enum(['bloco', 'criterio']),
    ref: z.string().min(1),
    direcao: z.enum(['desc', 'asc']).default('desc'),
  })).nullable().optional(),
  tiposProponentePermitidos: z.array(z.enum(['PF', 'MEI', 'PJ', 'COLETIVO'])).default([]),
  // Equipe do edital (IDs dos membros)
  equipeAvaliadores: z.array(z.string().min(1)).default([]),
  equipeHabilitadores: z.array(z.string().min(1)).default([]),
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

// ── Sincronizar equipe do edital ────────────────────────────────────────────

async function syncEquipe(editalId: string, avaliadorIds: string[], habilitadorIds: string[]) {
  // Buscar membros atuais
  const membrosAtuais = await prisma.editalMembro.findMany({
    where: { editalId },
    select: { userId: true, funcao: true },
  })

  const atuaisAval = new Set(membrosAtuais.filter(m => m.funcao === 'AVALIADOR').map(m => m.userId))
  const atuaisHab = new Set(membrosAtuais.filter(m => m.funcao === 'HABILITADOR').map(m => m.userId))
  const novosAval = new Set(avaliadorIds)
  const novosHab = new Set(habilitadorIds)

  // Remover quem saiu
  const avalRemover = [...atuaisAval].filter(id => !novosAval.has(id))
  const habRemover = [...atuaisHab].filter(id => !novosHab.has(id))
  if (avalRemover.length > 0 || habRemover.length > 0) {
    await prisma.editalMembro.deleteMany({
      where: {
        editalId,
        OR: [
          ...(avalRemover.length > 0 ? [{ userId: { in: avalRemover }, funcao: 'AVALIADOR' as const }] : []),
          ...(habRemover.length > 0 ? [{ userId: { in: habRemover }, funcao: 'HABILITADOR' as const }] : []),
        ],
      },
    })
  }

  // Adicionar quem entrou
  const avalAdicionar = avaliadorIds.filter(id => !atuaisAval.has(id))
  const habAdicionar = habilitadorIds.filter(id => !atuaisHab.has(id))
  const novos = [
    ...avalAdicionar.map(userId => ({ editalId, userId, funcao: 'AVALIADOR' as const })),
    ...habAdicionar.map(userId => ({ editalId, userId, funcao: 'HABILITADOR' as const })),
  ]
  if (novos.length > 0) {
    await prisma.editalMembro.createMany({ data: novos, skipDuplicates: true })
  }

  return { adicionados: novos.length, removidos: avalRemover.length + habRemover.length }
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
        etapasCustomizadas: data.etapasCustomizadas as unknown as import('@prisma/client').Prisma.InputJsonValue,
        vagasContemplados: data.vagasContemplados ?? null,
        vagasSuplentes: data.vagasSuplentes ?? null,
        criteriosAvaliacao: (data.criteriosAvaliacao ?? null) as unknown as import('@prisma/client').Prisma.InputJsonValue,
        formulaAvaliacao: data.formulaAvaliacao ?? null,
        tiposAnexo: (data.tiposAnexo ?? null) as unknown as import('@prisma/client').Prisma.InputJsonValue,
        notaMinima: data.notaMinima ?? null,
        desempate: (data.desempate ?? null) as unknown as import('@prisma/client').Prisma.InputJsonValue,
        tiposProponentePermitidos: data.tiposProponentePermitidos,
        ...(data.status !== 'RASCUNHO' ? { publishedAt: new Date() } : {}),
      },
    })

    // Salvar equipe do edital
    if (data.equipeAvaliadores.length > 0 || data.equipeHabilitadores.length > 0) {
      await syncEquipe(edital.id, data.equipeAvaliadores, data.equipeHabilitadores)
    }

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

    // Se saiu de RASCUNHO pela primeira vez, registrar data de publicação
    const isPublishing = existing.status === 'RASCUNHO' && data.status !== 'RASCUNHO'
    const publishedAt = isPublishing && !existing.publishedAt ? new Date() : undefined

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
        etapasCustomizadas: data.etapasCustomizadas as unknown as import('@prisma/client').Prisma.InputJsonValue,
        vagasContemplados: data.vagasContemplados ?? null,
        vagasSuplentes: data.vagasSuplentes ?? null,
        criteriosAvaliacao: (data.criteriosAvaliacao ?? null) as unknown as import('@prisma/client').Prisma.InputJsonValue,
        formulaAvaliacao: data.formulaAvaliacao ?? null,
        tiposAnexo: (data.tiposAnexo ?? null) as unknown as import('@prisma/client').Prisma.InputJsonValue,
        notaMinima: data.notaMinima ?? null,
        desempate: (data.desempate ?? null) as unknown as import('@prisma/client').Prisma.InputJsonValue,
        tiposProponentePermitidos: data.tiposProponentePermitidos,
        ...(publishedAt ? { publishedAt } : {}),
      },
    })

    // Sincronizar equipe do edital
    console.log('[equipe-sync] editalId:', edital.id, 'aval:', data.equipeAvaliadores, 'hab:', data.equipeHabilitadores)
    await syncEquipe(edital.id, data.equipeAvaliadores, data.equipeHabilitadores)

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
