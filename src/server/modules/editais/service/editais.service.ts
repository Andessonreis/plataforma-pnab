import type { EditalStatus } from '@prisma/client'
import { logAudit } from '@server/lib/audit'
import { sanitizeContent } from '@shared/sanitize'
import { generateEditalSlug, ensureUniqueSlug } from '@shared/utils/slug'
import { BadRequestError } from '@server/lib/http/errors'
import { editaisRepository } from '../repository/editais.repository'
import { equipeEditalRepository } from '../repository/equipe-edital.repository'
import { EditalNaoEncontradoError } from '../errors/editais.errors'
import type {
  AvancarFaseInput,
  EditalAcessivelInput,
  EditalInput,
} from '@shared/schemas/editais.schema'
import type { Prisma } from '@prisma/client'

type JsonInput = Prisma.InputJsonValue

async function syncEquipe(editalId: string, avaliadorIds: string[], habilitadorIds: string[]) {
  const membrosAtuais = await equipeEditalRepository.listByEdital(editalId)

  const atuaisAval = new Set(membrosAtuais.filter((m) => m.funcao === 'AVALIADOR').map((m) => m.userId))
  const atuaisHab = new Set(membrosAtuais.filter((m) => m.funcao === 'HABILITADOR').map((m) => m.userId))
  const novosAval = new Set(avaliadorIds)
  const novosHab = new Set(habilitadorIds)

  const avalRemover = [...atuaisAval].filter((id) => !novosAval.has(id))
  const habRemover = [...atuaisHab].filter((id) => !novosHab.has(id))
  for (const userId of avalRemover) {
    await equipeEditalRepository.delete(editalId, userId, 'AVALIADOR')
  }
  for (const userId of habRemover) {
    await equipeEditalRepository.delete(editalId, userId, 'HABILITADOR')
  }

  const avalAdicionar = avaliadorIds.filter((id) => !atuaisAval.has(id))
  const habAdicionar = habilitadorIds.filter((id) => !atuaisHab.has(id))
  if (avalAdicionar.length > 0) {
    await equipeEditalRepository.createMany(editalId, avalAdicionar, 'AVALIADOR')
  }
  if (habAdicionar.length > 0) {
    await equipeEditalRepository.createMany(editalId, habAdicionar, 'HABILITADOR')
  }
}

const SEQUENCIA_FASES: EditalStatus[] = [
  'RASCUNHO',
  'PUBLICADO',
  'INSCRICOES_ABERTAS',
  'INSCRICOES_ENCERRADAS',
  'HABILITACAO',
  'AVALIACAO',
  'RESULTADO_PRELIMINAR',
  'RECURSO',
  'RESULTADO_FINAL',
  'ENCERRADO',
]

export async function createEdital(data: EditalInput, userId: string, ip?: string) {
  const slug = await ensureUniqueSlug(generateEditalSlug(data.titulo, data.ano), async (s) =>
    Boolean(await editaisRepository.findBySlug(s)),
  )

  const edital = await editaisRepository.create({
    titulo: data.titulo,
    slug,
    ano: data.ano,
    status: data.status,
    resumo: data.resumo ?? null,
    valorTotal: data.valorTotal ?? null,
    categorias: data.categorias,
    acoesAfirmativas: data.acoesAfirmativas ?? null,
    regrasElegibilidade: data.regrasElegibilidade ?? null,
    cronograma: data.cronograma as unknown as JsonInput,
    camposFormulario: data.camposFormulario as unknown as JsonInput,
    etapasCustomizadas: data.etapasCustomizadas as unknown as JsonInput,
    vagasContemplados: data.vagasContemplados ?? null,
    vagasSuplentes: data.vagasSuplentes ?? null,
    criteriosAvaliacao: (data.criteriosAvaliacao ?? null) as unknown as JsonInput,
    formulaAvaliacao: data.formulaAvaliacao ?? null,
    tiposAnexo: (data.tiposAnexo ?? null) as unknown as JsonInput,
    notaMinima: data.notaMinima ?? null,
    desempate: (data.desempate ?? null) as unknown as JsonInput,
    tiposProponentePermitidos: data.tiposProponentePermitidos,
    ...(data.status !== 'RASCUNHO' ? { publishedAt: new Date() } : {}),
  })

  if (data.equipeAvaliadores.length > 0 || data.equipeHabilitadores.length > 0) {
    await syncEquipe(edital.id, data.equipeAvaliadores, data.equipeHabilitadores)
  }

  await logAudit({
    userId,
    action: 'EDITAL_CRIADO',
    entity: 'Edital',
    entityId: edital.id,
    details: { titulo: edital.titulo, status: edital.status },
    ip,
  })

  return edital
}

export async function updateEdital(id: string, data: EditalInput, userId: string, ip?: string) {
  const existing = await editaisRepository.findById(id)
  if (!existing) throw new EditalNaoEncontradoError()

  let slug = existing.slug
  if (data.titulo !== existing.titulo) {
    slug = await ensureUniqueSlug(generateEditalSlug(data.titulo, data.ano), async (s) =>
      Boolean(await editaisRepository.findFirstBySlugExcludingId(s, id)),
    )
  }

  const isPublishing = existing.status === 'RASCUNHO' && data.status !== 'RASCUNHO'
  const publishedAt = isPublishing && !existing.publishedAt ? new Date() : undefined

  const edital = await editaisRepository.update(id, {
    titulo: data.titulo,
    slug,
    ano: data.ano,
    status: data.status,
    resumo: data.resumo ?? null,
    valorTotal: data.valorTotal ?? null,
    categorias: data.categorias,
    acoesAfirmativas: data.acoesAfirmativas ?? null,
    regrasElegibilidade: data.regrasElegibilidade ?? null,
    cronograma: data.cronograma as unknown as JsonInput,
    camposFormulario: data.camposFormulario as unknown as JsonInput,
    etapasCustomizadas: data.etapasCustomizadas as unknown as JsonInput,
    vagasContemplados: data.vagasContemplados ?? null,
    vagasSuplentes: data.vagasSuplentes ?? null,
    criteriosAvaliacao: (data.criteriosAvaliacao ?? null) as unknown as JsonInput,
    formulaAvaliacao: data.formulaAvaliacao ?? null,
    tiposAnexo: (data.tiposAnexo ?? null) as unknown as JsonInput,
    notaMinima: data.notaMinima ?? null,
    desempate: (data.desempate ?? null) as unknown as JsonInput,
    tiposProponentePermitidos: data.tiposProponentePermitidos,
    ...(publishedAt ? { publishedAt } : {}),
  })

  await syncEquipe(edital.id, data.equipeAvaliadores, data.equipeHabilitadores)

  await logAudit({
    userId,
    action: 'EDITAL_ATUALIZADO',
    entity: 'Edital',
    entityId: edital.id,
    details: { titulo: edital.titulo, status: edital.status },
    ip,
  })

  return edital
}

export async function avancarFase(id: string, data: AvancarFaseInput, userId: string, ip?: string) {
  const edital = await editaisRepository.findFaseInfoById(id)
  if (!edital) throw new EditalNaoEncontradoError()

  const statusAtual = edital.status as EditalStatus
  if (statusAtual === data.proximoStatus) {
    throw new BadRequestError('O edital já está nesse status.')
  }

  const idxAtual = SEQUENCIA_FASES.indexOf(statusAtual)
  const idxNovo = SEQUENCIA_FASES.indexOf(data.proximoStatus as EditalStatus)
  const retrocesso = idxNovo < idxAtual

  const updateData: { status: EditalStatus; publishedAt?: Date } = {
    status: data.proximoStatus as EditalStatus,
  }
  if (statusAtual === 'RASCUNHO' && data.proximoStatus !== 'RASCUNHO' && !edital.publishedAt) {
    updateData.publishedAt = new Date()
  }

  await editaisRepository.update(id, updateData)

  await logAudit({
    userId,
    action: 'EDITAL_FASE_AVANCADA_MANUAL',
    entity: 'Edital',
    entityId: id,
    details: {
      statusAnterior: statusAtual,
      novoStatus: data.proximoStatus,
      justificativa: data.justificativa,
      retrocesso,
      editalTitulo: edital.titulo,
    },
    ip,
  })

  return {
    statusAnterior: statusAtual,
    novoStatus: data.proximoStatus,
    retrocesso,
  }
}

export async function updateAcessivel(id: string, data: EditalAcessivelInput, userId: string, ip?: string) {
  const edital = await editaisRepository.findIdById(id)
  if (!edital) throw new EditalNaoEncontradoError()

  const sanitized = sanitizeContent(data.conteudoAcessivel)

  await editaisRepository.update(id, { conteudoAcessivel: sanitized })

  await logAudit({
    userId,
    action: 'EDITAL_ATUALIZADO',
    entity: 'Edital',
    entityId: id,
    details: { campo: 'conteudoAcessivel' },
    ip,
  })
}
