import { Prisma } from '@prisma/client'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'
import { enqueueEmail } from '@/lib/queue'
import { BadRequestError, ConflictError, ForbiddenError } from '@server/lib/http/errors'
import type {
  CreateInscricaoInput,
  InscricoesAdminQuery,
  InscricoesProponenteQuery,
  UpdateInscricaoInput,
} from '@shared/schemas/inscricoes.schema'
import { EditalDaInscricaoNaoEncontradoError, InscricaoNaoEncontradaError } from './inscricoes.errors'
import { inscricoesRepository } from './inscricoes.repository'
import { validateSubmit } from './inscricoes.validation'

export async function createInscricao(data: CreateInscricaoInput, userId: string, ip?: string) {
  const edital = await inscricoesRepository.findEditalParaInscricao(data.editalId)
  if (!edital) throw new EditalDaInscricaoNaoEncontradoError()
  if (edital.status !== 'INSCRICOES_ABERTAS') {
    throw new ForbiddenError('As inscrições para este edital não estão abertas.')
  }

  const existente = await inscricoesRepository.findInscricaoExistente(data.editalId, userId)
  if (existente) throw new ConflictError('Você já possui uma inscrição neste edital.')

  if (data.categoria && edital.categorias.length > 0 && !edital.categorias.includes(data.categoria)) {
    throw new BadRequestError('Categoria inválida para este edital.')
  }

  let inscricao!: { id: string; numero: string }
  for (let attempt = 0; attempt < 3; attempt++) {
    const count = await inscricoesRepository.countNoAno(edital.ano)
    const numero = `PNAB-${edital.ano}-${String(count + 1).padStart(4, '0')}`
    try {
      inscricao = await inscricoesRepository.createRascunho({
        numero,
        editalId: data.editalId,
        proponenteId: userId,
        categoria: data.categoria ?? null,
      })
      break
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002' && attempt < 2) continue
      throw e
    }
  }

  await logAudit({
    userId,
    action: AUDIT_ACTIONS.INSCRICAO_CRIADA,
    entity: 'Inscricao',
    entityId: inscricao.id,
    details: { editalId: data.editalId, numero: inscricao.numero },
    ip,
  })

  return inscricao
}

export async function updateInscricao(id: string, data: UpdateInscricaoInput, userId: string) {
  const inscricao = await inscricoesRepository.findOwnership(id)
  if (!inscricao) throw new InscricaoNaoEncontradaError()
  if (inscricao.proponenteId !== userId) throw new ForbiddenError('Acesso negado.')
  if (inscricao.status !== 'RASCUNHO') throw new ForbiddenError('Apenas rascunhos podem ser editados.')

  if (data.categoria !== undefined && data.categoria) {
    const edital = await inscricoesRepository.findEditalCategorias(inscricao.editalId)
    if (edital && edital.categorias.length > 0 && !edital.categorias.includes(data.categoria)) {
      throw new BadRequestError('Categoria inválida para este edital.')
    }
  }

  const updateData: Prisma.InscricaoUpdateInput = {}
  if (data.campos !== undefined) updateData.campos = data.campos as Prisma.InputJsonValue
  if (data.categoria !== undefined) updateData.categoria = data.categoria || null
  if (data.orcamento !== undefined) updateData.orcamento = data.orcamento as Prisma.InputJsonValue

  return inscricoesRepository.updateConteudo(id, updateData)
}

export async function submitInscricao(id: string, userId: string, ip?: string) {
  const inscricao = await inscricoesRepository.findParaSubmit(id)
  if (!inscricao) throw new InscricaoNaoEncontradaError()
  if (inscricao.proponenteId !== userId) throw new ForbiddenError('Acesso negado.')
  if (inscricao.status !== 'RASCUNHO') throw new ForbiddenError('Esta inscrição já foi enviada.')
  if (inscricao.edital.status !== 'INSCRICOES_ABERTAS') {
    throw new ForbiddenError('O prazo de inscrições para este edital foi encerrado.')
  }

  validateSubmit(inscricao)

  const now = new Date()
  const updated = await inscricoesRepository.marcarEnviada(id, now)

  await logAudit({
    userId,
    action: AUDIT_ACTIONS.INSCRICAO_ENVIADA,
    entity: 'Inscricao',
    entityId: id,
    details: { numero: updated.numero, editalId: inscricao.editalId },
    ip,
  })

  try {
    await enqueueEmail({
      to: inscricao.proponente.email,
      subject: `Inscrição ${updated.numero} enviada com sucesso`,
      template: 'comprovante_inscricao',
      data: {
        nome: inscricao.proponente.nome,
        numero: updated.numero,
        edital: inscricao.edital.titulo,
        submittedAt: now.toISOString(),
      },
    })
  } catch {
    console.error('[inscricao] Falha ao enfileirar e-mail de confirmação')
  }

  return { numero: updated.numero, submittedAt: updated.submittedAt?.toISOString() ?? null }
}

export async function retractInscricao(id: string, userId: string, ip?: string) {
  const inscricao = await inscricoesRepository.findParaRetract(id)
  if (!inscricao) throw new InscricaoNaoEncontradaError()
  if (inscricao.proponenteId !== userId) throw new ForbiddenError('Acesso negado.')
  if (inscricao.status !== 'ENVIADA') {
    throw new ForbiddenError('Apenas inscrições enviadas podem ser retiradas para edição.')
  }
  if (inscricao.edital.status !== 'INSCRICOES_ABERTAS') {
    throw new ForbiddenError('O prazo de inscrições para este edital foi encerrado.')
  }

  await inscricoesRepository.atualizarStatus(id, 'RASCUNHO')

  await logAudit({
    userId,
    action: AUDIT_ACTIONS.INSCRICAO_RETIRADA,
    entity: 'Inscricao',
    entityId: id,
    details: { editalId: inscricao.editalId },
    ip,
  })

  return { id, status: 'RASCUNHO' as const }
}

export async function getInscricaoById(id: string, callerId: string, callerRole: string) {
  const inscricao = await inscricoesRepository.findDetalhe(id)
  if (!inscricao) throw new InscricaoNaoEncontradaError()

  const isOwner = inscricao.proponenteId === callerId
  const isAdmin = callerRole === 'ADMIN'
  if (!isOwner && !isAdmin) throw new ForbiddenError('Acesso negado.')

  return inscricao
}

export function listAdmin(query: InscricoesAdminQuery) {
  return inscricoesRepository.listAdmin(query)
}

export function listByProponente(userId: string, query: InscricoesProponenteQuery) {
  return inscricoesRepository.listByProponente(userId, query)
}
