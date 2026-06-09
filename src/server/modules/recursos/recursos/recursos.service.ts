import type { InscricaoStatus } from '@prisma/client'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'
import { enqueueEmail } from '@/lib/queue'
import { ForbiddenError } from '@server/lib/http/errors'
import { InscricaoNaoEncontradaError } from '@server/modules/inscricoes/inscricoes/inscricoes.errors'
import type { DecidirRecursoInput, SubmeterRecursoInput } from '@shared/schemas/recursos.schema'
import { recursosRepository } from './recursos.repository'
import {
  FaseRecursoInvalidaError,
  RecursoDuplicadoError,
  RecursoJaDecididoError,
  RecursoNaoEncontradoError,
} from './recursos.errors'

const STATUS_ALLOWS_RECURSO: Record<string, string[]> = {
  INABILITADA: ['HABILITACAO'],
  RESULTADO_PRELIMINAR: ['RESULTADO_PRELIMINAR'],
  NAO_CONTEMPLADA: ['RESULTADO_FINAL'],
  SUPLENTE: ['RESULTADO_FINAL'],
}

export async function submitRecurso(
  inscricaoId: string,
  data: SubmeterRecursoInput,
  userId: string,
  ip?: string,
) {
  const inscricao = await recursosRepository.findInscricaoParaRecurso(inscricaoId)
  if (!inscricao) throw new InscricaoNaoEncontradaError()
  if (inscricao.proponenteId !== userId) {
    throw new ForbiddenError('Apenas o proponente pode interpor recurso.')
  }

  const fasesPermitidas = STATUS_ALLOWS_RECURSO[inscricao.status] ?? []
  if (!fasesPermitidas.includes(data.fase)) throw new FaseRecursoInvalidaError()

  const existente = await recursosRepository.findRecursoExistente(inscricaoId, data.fase)
  if (existente) throw new RecursoDuplicadoError()

  const recurso = await recursosRepository.createRecurso({
    inscricaoId,
    fase: data.fase,
    texto: data.texto,
    urlAnexos: data.urlAnexos,
  })
  await recursosRepository.setStatusInscricao(inscricaoId, 'RECURSO_ABERTO')

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
  const inscricao = await recursosRepository.findProponente(inscricaoId)
  if (!inscricao) throw new InscricaoNaoEncontradaError()

  const isOwner = inscricao.proponenteId === callerId
  const isStaff = callerRole === 'ADMIN' || callerRole === 'HABILITADOR'
  if (!isOwner && !isStaff) throw new ForbiddenError('Acesso negado.')

  return recursosRepository.listByInscricao(inscricaoId)
}

function novoStatusPorDecisao(decisao: string, fase: string): InscricaoStatus {
  if (decisao === 'DEFERIDO') return fase === 'HABILITACAO' ? 'HABILITADA' : 'RESULTADO_PRELIMINAR'
  if (fase === 'HABILITACAO') return 'INABILITADA'
  if (fase === 'RESULTADO_FINAL') return 'NAO_CONTEMPLADA'
  return 'RESULTADO_PRELIMINAR'
}

export async function decideRecurso(
  inscricaoId: string,
  recursoId: string,
  data: DecidirRecursoInput,
  userId: string,
  ip?: string,
) {
  const recurso = await recursosRepository.findRecursoComInscricao(recursoId)
  if (!recurso || recurso.inscricaoId !== inscricaoId) throw new RecursoNaoEncontradoError()
  if (recurso.decisao) throw new RecursoJaDecididoError()

  await recursosRepository.decidir(recursoId, {
    decisao: data.decisao,
    justificativa: data.justificativa,
    decidedAt: new Date(),
  })
  await recursosRepository.setStatusInscricao(inscricaoId, novoStatusPorDecisao(data.decisao, recurso.fase))

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

  return { mensagem: 'Recurso decidido.' }
}
