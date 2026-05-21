import { prisma } from '@server/lib/db'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'
import { CRITERIOS_AVALIACAO_PADRAO } from '@/lib/avaliacao-criterios'
import { gateAcaoFase } from '@/lib/edital/gate'
import { ServiceError } from './errors'
import type { AvaliacaoInput } from '@/lib/schemas/avaliacao'

export async function getAvaliacao(inscricaoId: string, avaliadorId: string, isAdmin: boolean) {
  const inscricao = await prisma.inscricao.findUnique({
    where: { id: inscricaoId },
    include: {
      edital: { select: { id: true } },
      avaliacoes: {
        where: { avaliadorId },
        select: { id: true, notas: true, parecer: true, notaTotal: true, finalizada: true, updatedAt: true },
      },
    },
  })

  if (!inscricao) throw new ServiceError('NOT_FOUND', 'Inscrição não encontrada.')

  const avaliacao = inscricao.avaliacoes[0] ?? null
  const isAssigned = isAdmin || avaliacao !== null

  if (!isAssigned) throw new ServiceError('FORBIDDEN', 'Esta inscrição não foi atribuída a você.')

  return {
    avaliacao,
    criterios: [...CRITERIOS_AVALIACAO_PADRAO],
    inscricaoStatus: inscricao.status,
  }
}

export async function saveAvaliacao(
  inscricaoId: string,
  data: AvaliacaoInput,
  avaliadorId: string,
  isAdmin: boolean,
) {
  const inscricao = await prisma.inscricao.findUnique({
    where: { id: inscricaoId },
    select: {
      id: true,
      numero: true,
      status: true,
      edital: { select: { status: true } },
    },
  })

  if (!inscricao) throw new ServiceError('NOT_FOUND', 'Inscrição não encontrada.')

  // Gate de fase do edital — bloqueia fora de AVALIACAO
  const gate = gateAcaoFase({
    editalStatus: inscricao.edital.status,
    acao: 'avaliar',
    role: isAdmin ? 'ADMIN' : 'AVALIADOR',
    override: data.adminOverride,
  })

  if (!gate.ok) {
    await logAudit({
      userId: avaliadorId,
      action: 'AVALIACAO_FORA_DA_FASE_BLOQUEADA',
      entity: 'Inscricao',
      entityId: inscricaoId,
      details: { editalStatus: inscricao.edital.status, motivo: gate.mensagem },
    })
    throw new ServiceError('BAD_REQUEST', gate.mensagem)
  }

  const existingAvaliacao = await prisma.avaliacao.findUnique({
    where: { inscricaoId_avaliadorId: { inscricaoId, avaliadorId } },
    select: { id: true, finalizada: true },
  })

  if (existingAvaliacao?.finalizada && !isAdmin) {
    throw new ServiceError('LOCKED', 'Esta avaliação já foi finalizada e não pode ser alterada.')
  }

  const totalPeso = data.notas.reduce((acc, n) => acc + n.peso, 0)
  const notaTotal = totalPeso > 0
    ? data.notas.reduce((acc, n) => acc + (n.nota * n.peso) / totalPeso, 0)
    : 0

  const avaliacaoData = {
    notas: data.notas,
    parecer: data.parecer ?? null,
    notaTotal: parseFloat(notaTotal.toFixed(2)),
    finalizada: data.finalizar,
  }

  const avaliacao = await prisma.avaliacao.upsert({
    where: { inscricaoId_avaliadorId: { inscricaoId, avaliadorId } },
    update: avaliacaoData,
    create: { inscricaoId, avaliadorId, ...avaliacaoData },
    select: { id: true, notaTotal: true, finalizada: true, updatedAt: true },
  })

  await logAudit({
    userId: avaliadorId,
    action: data.finalizar ? 'AVALIACAO_FINALIZADA' : 'AVALIACAO_RASCUNHO_SALVO',
    entity: 'Avaliacao',
    entityId: avaliacao.id,
    details: {
      inscricaoId,
      inscricaoNumero: inscricao.numero,
      notaTotal: avaliacao.notaTotal === null ? null : String(avaliacao.notaTotal),
      finalizada: avaliacao.finalizada,
      adminOverride: gate.overrideUsed,
      adminOverrideJustificativa: gate.overrideUsed ? data.adminOverrideJustificativa : null,
      editalStatus: inscricao.edital.status,
    },
  })

  return avaliacao
}

export async function assignAvaliadores(
  inscricaoId: string,
  avaliadorIds: string[],
  adminId: string,
  options?: { adminOverride?: boolean; adminOverrideJustificativa?: string },
) {
  // Pré-checagem: existência + fase do edital
  const inscricaoCheck = await prisma.inscricao.findUnique({
    where: { id: inscricaoId },
    select: { id: true, edital: { select: { status: true } } },
  })

  if (!inscricaoCheck) throw new ServiceError('NOT_FOUND', 'Inscrição não encontrada.')

  const gate = gateAcaoFase({
    editalStatus: inscricaoCheck.edital.status,
    acao: 'atribuir_avaliador',
    role: 'ADMIN',
    override: options?.adminOverride,
  })

  if (!gate.ok) {
    await logAudit({
      userId: adminId,
      action: 'AVALIADOR_ATRIBUIDO_FORA_DA_FASE_BLOQUEADO',
      entity: 'Inscricao',
      entityId: inscricaoId,
      details: { editalStatus: inscricaoCheck.edital.status, motivo: gate.mensagem },
    })
    throw new ServiceError('BAD_REQUEST', gate.mensagem)
  }

  const result = await prisma.$transaction(async (tx) => {
    const inscricao = await tx.inscricao.findUnique({
      where: { id: inscricaoId },
      select: { id: true, status: true, numero: true },
    })

    if (!inscricao) throw new ServiceError('NOT_FOUND', 'Inscrição não encontrada.')

    if (inscricao.status !== 'HABILITADA' && inscricao.status !== 'EM_AVALIACAO') {
      throw new ServiceError('BAD_REQUEST', 'Inscrição deve estar HABILITADA ou EM_AVALIACAO.')
    }

    const avaliadores = await tx.user.findMany({
      where: { id: { in: avaliadorIds }, role: 'AVALIADOR', ativo: true },
      select: { id: true },
    })

    if (avaliadores.length !== avaliadorIds.length) {
      throw new ServiceError('BAD_REQUEST', 'Um ou mais avaliadores inválidos.')
    }

    const existing = await tx.avaliacao.findMany({
      where: { inscricaoId, avaliadorId: { in: avaliadorIds } },
      select: { avaliadorId: true },
    })
    const existingIds = new Set(existing.map((e) => e.avaliadorId))
    const newIds = avaliadorIds.filter((id) => !existingIds.has(id))

    if (newIds.length === 0) return { created: 0 }

    await tx.avaliacao.createMany({
      data: newIds.map((avaliadorId) => ({
        inscricaoId,
        avaliadorId,
        notas: [],
        notaTotal: null,
        finalizada: false,
      })),
    })

    if (inscricao.status === 'HABILITADA') {
      await tx.inscricao.update({ where: { id: inscricaoId }, data: { status: 'EM_AVALIACAO' } })
    }

    return { created: newIds.length, newIds, numero: inscricao.numero }
  })

  if (result.created > 0 && result.newIds) {
    await logAudit({
      userId: adminId,
      action: AUDIT_ACTIONS.AVALIADOR_ATRIBUIDO,
      entity: 'Inscricao',
      entityId: inscricaoId,
      details: {
        avaliadorIds: result.newIds,
        numero: result.numero,
        adminOverride: gate.overrideUsed,
        adminOverrideJustificativa: gate.overrideUsed ? options?.adminOverrideJustificativa : null,
        editalStatus: inscricaoCheck.edital.status,
      },
    })
  }

  return result
}

export async function removeAvaliador(
  inscricaoId: string,
  avaliadorId: string,
  adminId: string,
) {
  await prisma.$transaction(async (tx) => {
    const inscricao = await tx.inscricao.findUnique({
      where: { id: inscricaoId },
      select: { id: true, status: true },
    })
    if (!inscricao) throw new ServiceError('NOT_FOUND', 'Inscrição não encontrada.')

    const avaliacao = await tx.avaliacao.findUnique({
      where: { inscricaoId_avaliadorId: { inscricaoId, avaliadorId } },
      select: { id: true, finalizada: true },
    })
    if (!avaliacao) throw new ServiceError('NOT_FOUND', 'Avaliação não encontrada.')
    if (avaliacao.finalizada) throw new ServiceError('LOCKED', 'Não é possível remover avaliação já finalizada.')

    await tx.avaliacao.delete({
      where: { inscricaoId_avaliadorId: { inscricaoId, avaliadorId } },
    })

    const remaining = await tx.avaliacao.count({ where: { inscricaoId } })
    if (remaining === 0 && inscricao.status === 'EM_AVALIACAO') {
      await tx.inscricao.update({ where: { id: inscricaoId }, data: { status: 'HABILITADA' } })
    }
  })

  await logAudit({
    userId: adminId,
    action: AUDIT_ACTIONS.AVALIADOR_REMOVIDO,
    entity: 'Inscricao',
    entityId: inscricaoId,
    details: { avaliadorId },
  })
}

export async function listAvaliadores() {
  return prisma.user.findMany({
    where: { role: 'AVALIADOR', ativo: true },
    select: { id: true, nome: true, email: true },
    orderBy: { nome: 'asc' },
  })
}
