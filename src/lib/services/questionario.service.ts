import { Prisma, type StatusConteudo } from '@prisma/client'
import { prisma } from '@/lib/db'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'
import { ServiceError } from './errors'
import type { ListarQuestionariosInput, QuestionarioInput } from '@/lib/schemas/questionario'
import type { CampoFormulario } from '@/types/campo-formulario'

/**
 * Questionários dinâmicos: o painel define os campos, publica e recebe
 * respostas. Toda alteração de campos sobe a `versao` — cada resposta guarda
 * a versão e uma cópia dos campos da época, então mudar perguntas nunca
 * reescreve o significado de respostas antigas. Respostas ficam em
 * `questionario-resposta.service.ts`.
 */

const NAO_ENCONTRADO = 'Questionário não encontrado.'

export const CAMPOS_PUBLICOS = {
  id: true,
  slug: true,
  titulo: true,
  descricao: true,
  finalidade: true,
  campos: true,
  versao: true,
  exigeLogin: true,
  mensagemSucesso: true,
} satisfies Prisma.QuestionarioSelect

function paraBanco(data: QuestionarioInput) {
  return {
    slug: data.slug,
    titulo: data.titulo,
    descricao: data.descricao || null,
    finalidade: data.finalidade,
    campos: data.campos as unknown as Prisma.InputJsonValue,
    ...(data.status ? { status: data.status } : {}),
    exigeLogin: data.exigeLogin,
    mensagemSucesso: data.mensagemSucesso || null,
  }
}

async function garantirSlugLivre(slug: string, ignorarId?: string) {
  const existente = await prisma.questionario.findUnique({ where: { slug }, select: { id: true } })
  if (existente && existente.id !== ignorarId) {
    throw new ServiceError('CONFLICT', 'Já existe um questionário com este endereço.')
  }
}

async function buscarOuFalhar(id: string) {
  const questionario = await prisma.questionario.findUnique({ where: { id } })
  if (!questionario) throw new ServiceError('NOT_FOUND', NAO_ENCONTRADO)
  return questionario
}

export async function listarQuestionarios(filtros: ListarQuestionariosInput) {
  const where: Prisma.QuestionarioWhereInput = {
    ...(filtros.status ? { status: filtros.status } : {}),
    ...(filtros.finalidade ? { finalidade: filtros.finalidade } : {}),
    ...(filtros.busca ? { titulo: { contains: filtros.busca, mode: 'insensitive' } } : {}),
  }
  const { page, pageSize } = filtros
  const [data, total] = await Promise.all([
    prisma.questionario.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true, slug: true, titulo: true, finalidade: true, status: true,
        versao: true, exigeLogin: true, updatedAt: true, _count: { select: { respostas: true } },
      },
    }),
    prisma.questionario.count({ where }),
  ])
  return { data, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } }
}

export async function obterQuestionario(id: string) {
  return buscarOuFalhar(id)
}

/** Versão pública: só o que está publicado, sem metadados internos. */
export async function obterQuestionarioPublicado(slug: string) {
  const questionario = await prisma.questionario.findFirst({
    where: { slug, status: 'PUBLICADO' },
    select: CAMPOS_PUBLICOS,
  })
  if (!questionario) throw new ServiceError('NOT_FOUND', NAO_ENCONTRADO)
  return { ...questionario, campos: questionario.campos as unknown as CampoFormulario[] }
}

export async function criarQuestionario(data: QuestionarioInput, userId: string, ip?: string) {
  await garantirSlugLivre(data.slug)
  const questionario = await prisma.questionario.create({
    data: { ...paraBanco(data), criadoPorId: userId },
  })
  await logAudit({
    userId,
    action: AUDIT_ACTIONS.QUESTIONARIO_CRIADO,
    entity: 'Questionario',
    entityId: questionario.id,
    details: { slug: questionario.slug, finalidade: questionario.finalidade },
    ip,
  })
  return questionario
}

export async function atualizarQuestionario(id: string, data: QuestionarioInput, userId: string, ip?: string) {
  const atual = await buscarOuFalhar(id)
  await garantirSlugLivre(data.slug, id)

  const camposMudaram = JSON.stringify(atual.campos) !== JSON.stringify(data.campos)
  const questionario = await prisma.questionario.update({
    where: { id },
    data: { ...paraBanco(data), ...(camposMudaram ? { versao: { increment: 1 } } : {}) },
  })

  const publicou = atual.status !== 'PUBLICADO' && questionario.status === 'PUBLICADO'
  await logAudit({
    userId,
    action: publicou ? AUDIT_ACTIONS.QUESTIONARIO_PUBLICADO : AUDIT_ACTIONS.QUESTIONARIO_ATUALIZADO,
    entity: 'Questionario',
    entityId: id,
    details: { slug: questionario.slug, status: questionario.status, versao: questionario.versao },
    ip,
  })
  return questionario
}

/** Publicar, arquivar ou devolver para rascunho sem reenviar o questionário inteiro. */
export async function alterarStatusQuestionario(id: string, status: StatusConteudo, userId: string, ip?: string) {
  const atual = await buscarOuFalhar(id)
  const questionario = await prisma.questionario.update({ where: { id }, data: { status } })
  await logAudit({
    userId,
    action: status === 'PUBLICADO' ? AUDIT_ACTIONS.QUESTIONARIO_PUBLICADO : AUDIT_ACTIONS.QUESTIONARIO_ATUALIZADO,
    entity: 'Questionario',
    entityId: id,
    details: { slug: atual.slug, de: atual.status, para: status },
    ip,
  })
  return questionario
}

/** Respostas são registro histórico: questionário respondido só pode ser arquivado. */
export async function excluirQuestionario(id: string, userId: string, ip?: string) {
  const atual = await buscarOuFalhar(id)
  const respostas = await prisma.questionarioResposta.count({ where: { questionarioId: id } })
  if (respostas > 0) {
    throw new ServiceError('CONFLICT', 'Este questionário já tem respostas. Arquive-o em vez de excluir.')
  }
  await prisma.questionario.delete({ where: { id } })
  await logAudit({
    userId,
    action: AUDIT_ACTIONS.QUESTIONARIO_EXCLUIDO,
    entity: 'Questionario',
    entityId: id,
    details: { slug: atual.slug },
    ip,
  })
}

async function slugDaCopia(slugOriginal: string) {
  const base = `${slugOriginal}-copia`.slice(0, 74)
  for (let n = 1; n <= 50; n++) {
    const candidato = n === 1 ? base : `${base}-${n}`
    const existe = await prisma.questionario.findUnique({ where: { slug: candidato }, select: { id: true } })
    if (!existe) return candidato
  }
  throw new ServiceError('CONFLICT', 'Não foi possível gerar um endereço livre para a cópia.')
}

/** A cópia nasce em rascunho, na versão 1 e sem respostas. */
export async function duplicarQuestionario(id: string, userId: string, ip?: string) {
  const original = await buscarOuFalhar(id)
  const questionario = await prisma.questionario.create({
    data: {
      slug: await slugDaCopia(original.slug),
      titulo: `${original.titulo} (cópia)`.slice(0, 160),
      descricao: original.descricao,
      finalidade: original.finalidade,
      campos: original.campos as Prisma.InputJsonValue,
      status: 'RASCUNHO',
      exigeLogin: original.exigeLogin,
      mensagemSucesso: original.mensagemSucesso,
      criadoPorId: userId,
    },
  })
  await logAudit({
    userId,
    action: AUDIT_ACTIONS.QUESTIONARIO_CRIADO,
    entity: 'Questionario',
    entityId: questionario.id,
    details: { slug: questionario.slug, duplicadoDe: original.id },
    ip,
  })
  return questionario
}
