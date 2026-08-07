import { prisma } from '@/lib/db'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'
import { respostaRecursoLiberada } from '@/lib/edital/fase'
import { enqueueEmail } from '@/lib/queue'
import { ServiceError } from './errors'

const SITE_URL_FALLBACK = 'https://culturaeturismo.irece.ba.gov.br'

function siteBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || SITE_URL_FALLBACK).replace(/\/$/, '')
}

/** Notifica os admins ativos que um novo recurso foi interposto. */
async function notifyEquipeRecursoSubmetido(inscricaoId: string, editalTitulo: string, fase: string) {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN', ativo: true },
    select: { email: true },
  })
  if (admins.length === 0) return

  const url = `${siteBaseUrl()}/admin/inscricoes/${inscricaoId}`
  await Promise.all(
    admins.map((admin) =>
      enqueueEmail({
        to: admin.email,
        template: 'recurso_submetido',
        data: { edital: editalTitulo, fase, url },
      }),
    ),
  )
}

/** Notifica o proponente do resultado do recurso. */
async function notifyProponenteRecursoDecidido(inscricaoId: string, decisao: string, justificativa: string) {
  const inscricao = await prisma.inscricao.findUnique({
    where: { id: inscricaoId },
    select: {
      numero: true,
      proponente: { select: { nome: true, email: true } },
      edital: { select: { titulo: true } },
    },
  })
  if (!inscricao) return

  const url = `${siteBaseUrl()}/proponente/inscricoes/${inscricaoId}`
  await enqueueEmail({
    to: inscricao.proponente.email,
    template: 'recurso_decidido',
    data: {
      nome: inscricao.proponente.nome,
      numero: inscricao.numero,
      edital: inscricao.edital.titulo,
      decisao,
      justificativa,
      url,
    },
  })
}

const STATUS_ALLOWS_RECURSO: Record<string, string[]> = {
  INABILITADA: ['HABILITACAO'],
  RESULTADO_PRELIMINAR: ['RESULTADO_PRELIMINAR'],
  NAO_CONTEMPLADA: ['RESULTADO_FINAL'],
  SUPLENTE: ['RESULTADO_FINAL'],
}

type InscricaoStatusDecisao = 'HABILITADA' | 'INABILITADA' | 'RESULTADO_PRELIMINAR' | 'NAO_CONTEMPLADA'

function statusAposDecisao(fase: string, decisao: string): InscricaoStatusDecisao {
  if (decisao === 'DEFERIDO') {
    return fase === 'HABILITACAO' ? 'HABILITADA' : 'RESULTADO_PRELIMINAR'
  }
  if (fase === 'HABILITACAO') return 'INABILITADA'
  if (fase === 'RESULTADO_FINAL') return 'NAO_CONTEMPLADA'
  return 'RESULTADO_PRELIMINAR'
}

async function aplicarDecisao(
  inscricaoId: string,
  recursoId: string,
  fase: string,
  decisao: string,
  justificativa: string,
  por: 'CONSENSO' | 'ADMIN',
) {
  await prisma.recurso.update({
    where: { id: recursoId },
    data: { decisao, justificativa, decididoPor: por, decidedAt: new Date() },
  })

  await prisma.inscricao.update({
    where: { id: inscricaoId },
    data: { status: statusAposDecisao(fase, decisao) },
  })

  try {
    await notifyProponenteRecursoDecidido(inscricaoId, decisao, justificativa)
  } catch (err) {
    console.error({ message: 'Falha ao enfileirar e-mail de recurso decidido', inscricaoId, err })
  }
}

export async function submitRecurso(
  inscricaoId: string,
  data: { fase: string; texto: string; urlAnexos: string[] },
  userId: string,
  ip?: string,
) {
  const inscricao = await prisma.inscricao.findUnique({
    where: { id: inscricaoId },
    select: { proponenteId: true, status: true, editalId: true, edital: { select: { titulo: true } } },
  })

  if (!inscricao) throw new ServiceError('NOT_FOUND', 'Inscrição não encontrada.')
  if (inscricao.proponenteId !== userId) throw new ServiceError('FORBIDDEN', 'Apenas o proponente pode interpor recurso.')

  const allowedFases = STATUS_ALLOWS_RECURSO[inscricao.status] ?? []
  if (!allowedFases.includes(data.fase)) {
    throw new ServiceError('BAD_REQUEST', 'Não é possível interpor recurso nesta fase.')
  }

  const existing = await prisma.recurso.findFirst({
    where: { inscricaoId, fase: data.fase },
  })
  if (existing) throw new ServiceError('CONFLICT', 'Já existe um recurso para esta fase.')

  const recurso = await prisma.recurso.create({
    data: {
      inscricaoId,
      fase: data.fase,
      texto: data.texto,
      urlAnexos: data.urlAnexos,
    },
  })

  await prisma.inscricao.update({
    where: { id: inscricaoId },
    data: { status: 'RECURSO_ABERTO' },
  })

  await logAudit({
    userId,
    action: AUDIT_ACTIONS.RECURSO_SUBMETIDO,
    entity: 'Recurso',
    entityId: recurso.id,
    details: { inscricaoId, fase: data.fase },
    ip,
  })

  try {
    await notifyEquipeRecursoSubmetido(inscricaoId, inscricao.edital.titulo, data.fase)
  } catch (err) {
    console.error({ message: 'Falha ao enfileirar e-mail de recurso submetido', inscricaoId, err })
  }

  return recurso
}

export async function listRecursos(inscricaoId: string, callerId: string, callerRole: string) {
  const inscricao = await prisma.inscricao.findUnique({
    where: { id: inscricaoId },
    select: { proponenteId: true, edital: { select: { status: true } } },
  })

  if (!inscricao) throw new ServiceError('NOT_FOUND', 'Inscrição não encontrada.')

  const isOwner = inscricao.proponenteId === callerId
  const isStaff = ['ADMIN', 'HABILITADOR'].includes(callerRole)
  if (!isOwner && !isStaff) throw new ServiceError('FORBIDDEN', 'Acesso negado.')

  const recursos = await prisma.recurso.findMany({
    where: { inscricaoId },
    orderBy: { createdAt: 'desc' },
  })

  if (isStaff) return recursos

  // Proponente só vê a decisão consolidada após o fim da fase do recurso.
  return recursos.map((r) =>
    respostaRecursoLiberada(r.fase, inscricao.edital.status)
      ? r
      : { ...r, decisao: null, justificativa: null, decididoPor: null, decidedAt: null },
  )
}

export type ConsolidacaoEstado = 'PENDENTE' | 'DIVERGENTE' | 'CONSOLIDADO'

/**
 * Consolida um recurso a partir das respostas dos avaliadores.
 * - Todos os avaliadores responderam e concordaram → grava decisão automática + atualiza status.
 * - Responderam e divergiram → fica pendente para o admin decidir.
 * - Faltam respostas → fica pendente.
 */
export async function consolidarRecurso(recursoId: string): Promise<ConsolidacaoEstado> {
  const recurso = await prisma.recurso.findUnique({
    where: { id: recursoId },
    select: {
      inscricaoId: true,
      fase: true,
      decisao: true,
      respostas: { select: { decisao: true, justificativa: true } },
    },
  })

  if (!recurso) throw new ServiceError('NOT_FOUND', 'Recurso não encontrado.')
  if (recurso.decisao) return 'CONSOLIDADO'

  const atribuidos = await prisma.avaliacao.count({ where: { inscricaoId: recurso.inscricaoId } })
  if (atribuidos === 0 || recurso.respostas.length < atribuidos) return 'PENDENTE'

  const todasDeferidas = recurso.respostas.every((r) => r.decisao === 'DEFERIDO')
  const todasIndeferidas = recurso.respostas.every((r) => r.decisao === 'INDEFERIDO')
  if (!todasDeferidas && !todasIndeferidas) return 'DIVERGENTE'

  const decisao = todasDeferidas ? 'DEFERIDO' : 'INDEFERIDO'
  const justificativa = recurso.respostas.map((r) => r.justificativa).join('\n\n')

  await aplicarDecisao(recurso.inscricaoId, recursoId, recurso.fase, decisao, justificativa, 'CONSENSO')
  return 'CONSOLIDADO'
}

/**
 * Resposta de um avaliador a um recurso (cega entre avaliadores).
 * Após gravar, tenta consolidar automaticamente.
 */
export async function responderRecurso(
  inscricaoId: string,
  recursoId: string,
  data: { decisao: string; justificativa: string },
  avaliadorId: string,
  ip?: string,
): Promise<ConsolidacaoEstado> {
  const recurso = await prisma.recurso.findUnique({
    where: { id: recursoId },
    select: { inscricaoId: true, fase: true, decisao: true },
  })

  if (!recurso || recurso.inscricaoId !== inscricaoId) {
    throw new ServiceError('NOT_FOUND', 'Recurso não encontrado.')
  }
  if (recurso.decisao) throw new ServiceError('CONFLICT', 'Este recurso já foi decidido.')

  const atribuido = await prisma.avaliacao.findUnique({
    where: { inscricaoId_avaliadorId: { inscricaoId, avaliadorId } },
    select: { id: true },
  })
  if (!atribuido) {
    throw new ServiceError('FORBIDDEN', 'Apenas avaliadores da inscrição podem responder o recurso.')
  }

  await prisma.recursoResposta.upsert({
    where: { recursoId_avaliadorId: { recursoId, avaliadorId } },
    create: { recursoId, avaliadorId, decisao: data.decisao, justificativa: data.justificativa },
    update: { decisao: data.decisao, justificativa: data.justificativa },
  })

  await logAudit({
    userId: avaliadorId,
    action: AUDIT_ACTIONS.RECURSO_RESPONDIDO,
    entity: 'Recurso',
    entityId: recursoId,
    details: { inscricaoId, decisao: data.decisao, fase: recurso.fase },
    ip,
  })

  return consolidarRecurso(recursoId)
}

/**
 * Decisão de desempate pelo admin/habilitador, quando os avaliadores divergem.
 */
export async function decideRecurso(
  inscricaoId: string,
  recursoId: string,
  data: { decisao: string; justificativa: string },
  userId: string,
  ip?: string,
) {
  const recurso = await prisma.recurso.findUnique({
    where: { id: recursoId },
    select: { inscricaoId: true, fase: true, decisao: true },
  })

  if (!recurso || recurso.inscricaoId !== inscricaoId) {
    throw new ServiceError('NOT_FOUND', 'Recurso não encontrado.')
  }
  if (recurso.decisao) throw new ServiceError('CONFLICT', 'Este recurso já foi decidido.')

  await aplicarDecisao(inscricaoId, recursoId, recurso.fase, data.decisao, data.justificativa, 'ADMIN')

  await logAudit({
    userId,
    action: AUDIT_ACTIONS.RECURSO_DECIDIDO,
    entity: 'Recurso',
    entityId: recursoId,
    details: { inscricaoId, decisao: data.decisao, fase: recurso.fase, por: 'ADMIN' },
    ip,
  })
}
