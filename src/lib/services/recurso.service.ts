import { prisma } from '@server/lib/db'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'
import { enqueueEmail } from '@/lib/queue'
import { ServiceError } from './errors'

const STATUS_ALLOWS_RECURSO: Record<string, string[]> = {
  INABILITADA: ['HABILITACAO'],
  RESULTADO_PRELIMINAR: ['RESULTADO_PRELIMINAR'],
  NAO_CONTEMPLADA: ['RESULTADO_FINAL'],
  SUPLENTE: ['RESULTADO_FINAL'],
}

export async function submitRecurso(
  inscricaoId: string,
  data: { fase: string; texto: string; urlAnexos: string[] },
  userId: string,
  ip?: string,
) {
  const inscricao = await prisma.inscricao.findUnique({
    where: { id: inscricaoId },
    select: { proponenteId: true, status: true, editalId: true },
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

  return recurso
}

export async function listRecursos(inscricaoId: string, callerId: string, callerRole: string) {
  const inscricao = await prisma.inscricao.findUnique({
    where: { id: inscricaoId },
    select: { proponenteId: true },
  })

  if (!inscricao) throw new ServiceError('NOT_FOUND', 'Inscrição não encontrada.')

  const isOwner = inscricao.proponenteId === callerId
  const isStaff = ['ADMIN', 'HABILITADOR'].includes(callerRole)
  if (!isOwner && !isStaff) throw new ServiceError('FORBIDDEN', 'Acesso negado.')

  return prisma.recurso.findMany({
    where: { inscricaoId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function decideRecurso(
  inscricaoId: string,
  recursoId: string,
  data: { decisao: string; justificativa: string },
  userId: string,
  ip?: string,
) {
  const recurso = await prisma.recurso.findUnique({
    where: { id: recursoId },
    include: {
      inscricao: {
        include: {
          proponente: { select: { email: true, nome: true } },
          edital: { select: { titulo: true, slug: true } },
        },
      },
    },
  })

  if (!recurso || recurso.inscricaoId !== inscricaoId) {
    throw new ServiceError('NOT_FOUND', 'Recurso não encontrado.')
  }
  if (recurso.decisao) throw new ServiceError('CONFLICT', 'Este recurso já foi decidido.')

  await prisma.recurso.update({
    where: { id: recursoId },
    data: {
      decisao: data.decisao,
      justificativa: data.justificativa,
      decidedAt: new Date(),
    },
  })

  let newStatus: string
  if (data.decisao === 'DEFERIDO') {
    newStatus = recurso.fase === 'HABILITACAO' ? 'HABILITADA' : 'RESULTADO_PRELIMINAR'
  } else {
    if (recurso.fase === 'HABILITACAO') newStatus = 'INABILITADA'
    else if (recurso.fase === 'RESULTADO_FINAL') newStatus = 'NAO_CONTEMPLADA'
    else newStatus = 'RESULTADO_PRELIMINAR'
  }

  await prisma.inscricao.update({
    where: { id: inscricaoId },
    data: { status: newStatus as 'HABILITADA' | 'INABILITADA' | 'RESULTADO_PRELIMINAR' | 'NAO_CONTEMPLADA' },
  })

  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  try {
    await enqueueEmail({
      to: recurso.inscricao.proponente.email,
      subject: `Recurso ${data.decisao === 'DEFERIDO' ? 'Deferido' : 'Indeferido'} — ${recurso.inscricao.edital.titulo}`,
      template: 'resultado_final',
      data: {
        edital: recurso.inscricao.edital.titulo,
        url: `${baseUrl}/proponente/inscricoes/${inscricaoId}`,
      },
    })
  } catch {
    console.error('[recurso] Falha ao enfileirar e-mail de decisão')
  }

  await logAudit({
    userId,
    action: AUDIT_ACTIONS.RECURSO_DECIDIDO,
    entity: 'Recurso',
    entityId: recursoId,
    details: { inscricaoId, decisao: data.decisao, fase: recurso.fase },
    ip,
  })
}
