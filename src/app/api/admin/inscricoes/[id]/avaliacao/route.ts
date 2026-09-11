import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { parseCriterios, validarNotasContraCriterios } from '@/lib/avaliacao-criterios'
import { calculateTotal } from '@/lib/results/formula'
import { temAcessoEdital } from '@/lib/edital-acesso'
import { gateAcaoFase } from '@/lib/edital/gate'
import { STATUS_BLOQUEADO_PARA_AVALIADOR } from '@/lib/services/avaliacao-buckets'
import type { UserRole } from '@prisma/client'

export const runtime = 'nodejs'

// O teto real de cada nota é o `notaMax` do critério do edital — validado no
// handler, depois de carregar o edital. Aqui só um guarda de sanidade.
const notaItemSchema = z.object({
  criterio: z.string().min(1),
  nota: z.number().min(0).max(1000),
  peso: z.number().min(0).max(100),
})

const avaliacaoBodySchema = z.object({
  notas: z.array(notaItemSchema).min(1),
  parecer: z.string().optional(),
  finalizar: z.boolean().default(false),
  adminOverride: z.boolean().optional(),
  adminOverrideJustificativa: z.string().trim().min(10).optional(),
}).refine(
  (data) => {
    if (data.adminOverride === true) {
      return Boolean(data.adminOverrideJustificativa && data.adminOverrideJustificativa.length >= 10)
    }
    return true
  },
  {
    message: 'Justificativa é obrigatória para override (mínimo 10 caracteres).',
    path: ['adminOverrideJustificativa'],
  },
)

const ROLES_PERMITIDOS: UserRole[] = ['ADMIN', 'SUPER_ADMIN', 'AVALIADOR']

// ─── GET — carrega avaliação existente + critérios do edital ─────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const session = await auth()
    if (!session || !ROLES_PERMITIDOS.includes(session.user.role as UserRole)) {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso negado.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const { id } = await params

    const inscricao = await prisma.inscricao.findUnique({
      where: { id },
      include: {
        edital: { select: { id: true, criteriosAvaliacao: true, formulaAvaliacao: true } },
        avaliacoes: {
          where: { avaliadorId: session.user.id },
          select: {
            id: true,
            notas: true,
            parecer: true,
            notaTotal: true,
            finalizada: true,
            updatedAt: true,
          },
        },
      },
    })

    if (!inscricao) {
      const res = NextResponse.json(
        { error: 'NOT_FOUND', message: 'Inscrição não encontrada.', requestId },
        { status: 404 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const isAdminCaller = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)

    // Inscrição ainda não decidida (ou inabilitada) nunca vai pro avaliador,
    // mesmo que ele já tenha acesso à equipe do edital.
    if (!isAdminCaller && STATUS_BLOQUEADO_PARA_AVALIADOR.includes(inscricao.status)) {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'Esta inscrição não foi atribuída a você.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // Avaliador só pode ver inscrições atribuídas a ele
    const avaliacao = inscricao.avaliacoes[0] ?? null
    const isAssigned = isAdminCaller || avaliacao !== null

    if (!isAssigned) {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'Esta inscrição não foi atribuída a você.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const criterios = parseCriterios(inscricao.edital.criteriosAvaliacao)

    const res = NextResponse.json({
      avaliacao,
      criterios,
      inscricaoStatus: inscricao.status,
      formulaAvaliacao: inscricao.edital.formulaAvaliacao ?? null,
    })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({ requestId, method: 'GET', path: `/api/admin/inscricoes/${id}/avaliacao`, status: 200, durationMs: Date.now() - start })
    return res
  } catch (err) {
    const res = NextResponse.json(
      { error: 'INTERNAL', message: 'Erro interno.', requestId },
      { status: 500 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    return res
  }
}

// ─── PUT — salvar rascunho ou finalizar ──────────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const session = await auth()
    if (!session || !ROLES_PERMITIDOS.includes(session.user.role as UserRole)) {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso negado.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const { id } = await params
    const body = await req.json()
    const data = avaliacaoBodySchema.parse(body)

    // Verificar se a inscrição existe e buscar edital para fórmula
    const inscricao = await prisma.inscricao.findUnique({
      where: { id },
      select: {
        id: true,
        numero: true,
        status: true,
        editalId: true,
        edital: {
          select: {
            status: true,
            formulaAvaliacao: true,
            criteriosAvaliacao: true,
          },
        },
      },
    })

    if (!inscricao) {
      const res = NextResponse.json(
        { error: 'NOT_FOUND', message: 'Inscrição não encontrada.', requestId },
        { status: 404 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // AVALIADOR só pode avaliar inscrições de editais onde está na equipe
    if (session.user.role === 'AVALIADOR') {
      const ok = await temAcessoEdital(session.user.id, inscricao.editalId, 'AVALIADOR')
      if (!ok) {
        const res = NextResponse.json(
          { error: 'FORBIDDEN', message: 'Você não é avaliador deste edital.', requestId },
          { status: 403 },
        )
        res.headers.set('X-Request-Id', requestId)
        res.headers.set('Cache-Control', 'no-store')
        return res
      }
    }

    const criterios = parseCriterios(inscricao.edital.criteriosAvaliacao)
    const erroNotas = validarNotasContraCriterios(data.notas, criterios)

    if (erroNotas) {
      const res = NextResponse.json(
        { error: 'BAD_REQUEST', message: erroNotas, requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // ── Gate de fase do edital — bloqueia fora de AVALIACAO, exceto quando a
    // própria inscrição já está liberada pra avaliação em paralelo (fase.ts)
    const gate = gateAcaoFase({
      editalStatus: inscricao.edital.status,
      acao: 'avaliar',
      role: session.user.role as UserRole,
      override: data.adminOverride,
      inscricaoStatus: inscricao.status,
    })

    if (!gate.ok) {
      await logAudit({
        userId: session.user.id,
        action: 'AVALIACAO_FORA_DA_FASE_BLOQUEADA',
        entity: 'Inscricao',
        entityId: id,
        details: {
          editalStatus: inscricao.edital.status,
          motivo: gate.mensagem,
        },
      })

      const res = NextResponse.json(
        { error: 'FORA_DA_FASE', message: gate.mensagem, requestId },
        { status: 422 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // Verificar se já existe avaliação finalizada
    const existingAvaliacao = await prisma.avaliacao.findUnique({
      where: { inscricaoId_avaliadorId: { inscricaoId: id, avaliadorId: session.user.id } },
      select: { id: true, finalizada: true },
    })

    if (existingAvaliacao?.finalizada && !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      const res = NextResponse.json(
        { error: 'LOCKED', message: 'Esta avaliação já foi finalizada e não pode ser alterada.', requestId },
        { status: 422 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // Calcular nota total usando fórmula do edital (se existir) ou média ponderada
    const notaTotal = calculateTotal(data.notas, criterios, inscricao.edital.formulaAvaliacao)

    const avaliacaoData = {
      notas: data.notas,
      parecer: data.parecer ?? null,
      notaTotal: parseFloat(notaTotal.toFixed(2)),
      finalizada: data.finalizar,
    }

    const avaliacao = await prisma.avaliacao.upsert({
      where: { inscricaoId_avaliadorId: { inscricaoId: id, avaliadorId: session.user.id } },
      update: avaliacaoData,
      create: {
        inscricaoId: id,
        avaliadorId: session.user.id,
        ...avaliacaoData,
      },
      select: { id: true, notaTotal: true, finalizada: true, updatedAt: true },
    })

    await logAudit({
      userId: session.user.id,
      action: data.finalizar ? 'AVALIACAO_FINALIZADA' : 'AVALIACAO_RASCUNHO_SALVO',
      entity: 'Avaliacao',
      entityId: avaliacao.id,
      details: {
        inscricaoId: id,
        inscricaoNumero: inscricao.numero,
        notaTotal: String(avaliacao.notaTotal),
        finalizada: avaliacao.finalizada,
        adminOverride: gate.overrideUsed,
        adminOverrideJustificativa: gate.overrideUsed ? data.adminOverrideJustificativa : null,
        editalStatus: inscricao.edital.status,
      },
    })

    const res = NextResponse.json({
      avaliacao,
      message: data.finalizar ? 'Avaliação finalizada com sucesso.' : 'Rascunho salvo.',
    })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({ requestId, method: 'PUT', path: `/api/admin/inscricoes/${id}/avaliacao`, status: 200, durationMs: Date.now() - start })
    return res
  } catch (err) {
    if (err instanceof z.ZodError) {
      const res = NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Dados inválidos.', issues: err.issues, requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const res = NextResponse.json(
      { error: 'INTERNAL', message: 'Erro interno.', requestId },
      { status: 500 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    return res
  }
}
