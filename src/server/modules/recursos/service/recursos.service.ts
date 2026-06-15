import type { EditalStatus, InscricaoStatus } from '@prisma/client'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'
import { enqueueEmail } from '@/lib/queue'
import { respostaRecursoLiberada } from '@shared/edital/fase'
import { uploadFile, getSignedUrl } from '@/lib/storage'
import { validateMagicBytes, sanitizeFilename } from '@shared/upload/validate'
import { janelaParaAcao, mensagemJanela } from '@/lib/utils/cronograma-janela'
import type { AcaoJanela } from '@/types/cronograma'
import { BadRequestError, ForbiddenError, NotFoundError } from '@server/lib/http/errors'
import { InscricaoNaoEncontradaError } from '@server/modules/inscricoes/errors/inscricoes.errors'
import type { ConsolidacaoEstado } from '@shared/dtos/recursos.dto'
import type {
  DecidirRecursoInput,
  ResponderRecursoInput,
  SubmeterRecursoInput,
} from '@shared/schemas/recursos.schema'
import { recursosRepository } from '../repository/recursos.repository'
import {
  FaseRecursoInvalidaError,
  RecursoDuplicadoError,
  RecursoForaDaJanelaError,
  RecursoJaDecididoError,
  RecursoNaoEncontradoError,
} from '../errors/recursos.errors'

const BUCKET = 'propostas'
const INTERNAL_ROLES = ['ADMIN', 'HABILITADOR', 'AVALIADOR', 'ATENDIMENTO']
const MAX_ANEXO_SIZE = 10 * 1024 * 1024
const ANEXO_MIMES = ['application/pdf', 'image/png', 'image/jpeg']

const STATUS_ALLOWS_RECURSO: Record<string, string[]> = {
  INABILITADA: ['HABILITACAO'],
  RESULTADO_PRELIMINAR: ['RESULTADO_PRELIMINAR'],
  NAO_CONTEMPLADA: ['RESULTADO_FINAL'],
  SUPLENTE: ['RESULTADO_FINAL'],
}

const RECURSO_FASE_TO_JANELA: Partial<Record<string, AcaoJanela>> = {
  HABILITACAO: 'RECURSO_HABILITACAO_JANELA',
  RESULTADO_PRELIMINAR: 'RECURSO_RESULTADO_JANELA',
}

function storagePathFromUrl(url: string): string | undefined {
  return new URL(url).pathname.split(`/${BUCKET}/`).pop()
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

  const acaoJanela = RECURSO_FASE_TO_JANELA[data.fase]
  if (acaoJanela) {
    const info = janelaParaAcao(inscricao.edital.cronograma, acaoJanela)
    if (info && !info.ativa) {
      throw new RecursoForaDaJanelaError(`Recurso fora da janela. ${mensagemJanela(info)}.`)
    }
  }

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
  const inscricao = await recursosRepository.findInscricaoParaList(inscricaoId)
  if (!inscricao) throw new InscricaoNaoEncontradaError()

  const isOwner = inscricao.proponenteId === callerId
  const isStaff = callerRole === 'ADMIN' || callerRole === 'HABILITADOR'
  if (!isOwner && !isStaff) throw new ForbiddenError('Acesso negado.')

  const recursos = await recursosRepository.listByInscricao(inscricaoId)
  if (isStaff) return recursos

  const editalStatus = inscricao.edital.status
  return recursos.map((r) =>
    respostaRecursoLiberada(r.fase, editalStatus)
      ? r
      : { ...r, decisao: null, justificativa: null, decididoPor: null, decidedAt: null },
  )
}

function novoStatusPorDecisao(decisao: string, fase: string): InscricaoStatus {
  if (decisao === 'DEFERIDO') return fase === 'HABILITACAO' ? 'HABILITADA' : 'RESULTADO_PRELIMINAR'
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
  await recursosRepository.decidir(recursoId, {
    decisao,
    justificativa,
    decididoPor: por,
    decidedAt: new Date(),
  })
  await recursosRepository.setStatusInscricao(inscricaoId, novoStatusPorDecisao(decisao, fase))
}

export async function consolidarRecurso(recursoId: string): Promise<ConsolidacaoEstado> {
  const recurso = await recursosRepository.findRecursoParaConsolidacao(recursoId)
  if (!recurso) throw new RecursoNaoEncontradoError()
  if (recurso.decisao) return 'CONSOLIDADO'

  const atribuidos = await recursosRepository.countAvaliacoes(recurso.inscricaoId)
  if (atribuidos === 0 || recurso.respostas.length < atribuidos) return 'PENDENTE'

  const todasDeferidas = recurso.respostas.every((r) => r.decisao === 'DEFERIDO')
  const todasIndeferidas = recurso.respostas.every((r) => r.decisao === 'INDEFERIDO')
  if (!todasDeferidas && !todasIndeferidas) return 'DIVERGENTE'

  const decisao = todasDeferidas ? 'DEFERIDO' : 'INDEFERIDO'
  const justificativa = recurso.respostas.map((r) => r.justificativa).join('\n\n')

  await aplicarDecisao(recurso.inscricaoId, recursoId, recurso.fase, decisao, justificativa, 'CONSENSO')
  return 'CONSOLIDADO'
}

export async function responderRecurso(
  inscricaoId: string,
  recursoId: string,
  data: ResponderRecursoInput,
  avaliadorId: string,
  ip?: string,
): Promise<ConsolidacaoEstado> {
  const recurso = await recursosRepository.findRecursoBasico(recursoId)
  if (!recurso || recurso.inscricaoId !== inscricaoId) throw new RecursoNaoEncontradoError()
  if (recurso.decisao) throw new RecursoJaDecididoError()

  const atribuido = await recursosRepository.findAvaliacaoAtribuida(inscricaoId, avaliadorId)
  if (!atribuido) {
    throw new ForbiddenError('Apenas avaliadores da inscrição podem responder o recurso.')
  }

  await recursosRepository.upsertResposta(recursoId, avaliadorId, data.decisao, data.justificativa)

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

  await aplicarDecisao(inscricaoId, recursoId, recurso.fase, data.decisao, data.justificativa, 'ADMIN')

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
    details: { inscricaoId, decisao: data.decisao, fase: recurso.fase, por: 'ADMIN' },
    ip,
  })

  return { mensagem: 'Recurso decidido.' }
}

export async function getAnexoRecursoSignedUrl(
  inscricaoId: string,
  recursoId: string,
  url: string,
  user: { id: string; role: string },
) {
  const recurso = await recursosRepository.findRecursoAnexos(recursoId)
  if (!recurso || recurso.inscricaoId !== inscricaoId || !recurso.urlAnexos.includes(url)) {
    throw new NotFoundError('Anexo não encontrado.')
  }

  const isStaff = INTERNAL_ROLES.includes(user.role)
  const isOwner = recurso.inscricao.proponenteId === user.id
  if (!isStaff && !isOwner) throw new ForbiddenError('Acesso negado.')

  const storagePath = storagePathFromUrl(url)
  if (!storagePath) throw new BadRequestError('Caminho do arquivo inválido.')

  const signedUrl = await getSignedUrl(BUCKET, storagePath, 3600)
  return { url: signedUrl }
}

export async function uploadAnexoRecurso(
  inscricaoId: string,
  file: File,
  userId: string,
  ip?: string,
) {
  const inscricao = await recursosRepository.findInscricaoParaRecurso(inscricaoId)
  if (!inscricao) throw new InscricaoNaoEncontradaError()
  if (inscricao.proponenteId !== userId) throw new ForbiddenError('Acesso negado.')
  if (!(inscricao.status in STATUS_ALLOWS_RECURSO)) {
    throw new ForbiddenError('O status atual da inscrição não permite recurso.')
  }

  if (file.size > MAX_ANEXO_SIZE) throw new BadRequestError('Arquivo excede o limite de 10MB.')
  if (!ANEXO_MIMES.includes(file.type)) {
    throw new BadRequestError('Tipo de arquivo não permitido. Aceitos: PDF, PNG, JPEG.')
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  if (!validateMagicBytes(buffer, file.type)) {
    throw new BadRequestError('Conteúdo do arquivo não corresponde ao tipo declarado.')
  }

  const safeName = sanitizeFilename(file.name)
  const storagePath = `recursos/${inscricaoId}/${Date.now()}_${safeName}`
  const url = await uploadFile(BUCKET, storagePath, buffer, file.type)

  await logAudit({
    userId,
    action: 'RECURSO_ANEXO_ENVIADO',
    entity: 'Recurso',
    entityId: inscricaoId,
    details: { inscricaoId, filename: safeName, url },
    ip,
  })

  return { url, filename: safeName }
}
