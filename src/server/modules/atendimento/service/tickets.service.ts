import type { Prisma } from '@prisma/client'
import { logAudit, AUDIT_ACTIONS } from '@server/lib/audit'
import { editaisRepository } from '@server/modules/editais/repository/editais.repository'
import { EditalNaoEncontradoError } from '@server/modules/editais/errors/editais.errors'
import { ticketsRepository } from '../repository/tickets.repository'
import { AtendimentoNaoEncontradoError } from '../errors/tickets.errors'

interface CreateAtendimentoData {
  nomeContato: string
  emailContato: string
  assunto: string
  mensagem: string
  editalId?: string
  autorId?: string
}

interface HistoricoItem {
  de: string
  texto: string
  criadoEm: string
}

export async function createAtendimento(data: CreateAtendimentoData, ip?: string) {
  const protocolo = `ATD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

  const atendimento = await ticketsRepository.create({
    protocolo,
    nomeContato: data.nomeContato,
    emailContato: data.emailContato,
    assunto: data.assunto,
    mensagem: data.mensagem,
    editalId: data.editalId ?? null,
    autorId: data.autorId ?? null,
    historico: [],
  })

  await logAudit({
    userId: data.autorId,
    action: AUDIT_ACTIONS.ATENDIMENTO_CRIADO,
    entity: 'Atendimento',
    entityId: atendimento.id,
    details: { protocolo: atendimento.protocolo },
    ip,
  })

  return atendimento
}

export async function criarContatoPublico(data: CreateAtendimentoData, ip?: string) {
  if (data.editalId) {
    const edital = await editaisRepository.findById(data.editalId)
    if (!edital) throw new EditalNaoEncontradoError()
  }

  const atendimento = await createAtendimento(data, ip)
  return { protocolo: atendimento.protocolo }
}

export async function listAtendimentos(page: number, pageSize: number, status?: string) {
  const [data, total] = await ticketsRepository.list(page, pageSize, status)
  return { data, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } }
}

export async function getAtendimentoById(id: string) {
  const atendimento = await ticketsRepository.findByIdWithAutor(id)
  if (!atendimento) throw new AtendimentoNaoEncontradoError()
  return atendimento
}

export async function updateAtendimento(
  id: string,
  update: { status?: string; resposta?: { texto: string } },
  attendantName: string,
  ip?: string,
) {
  const atendimento = await ticketsRepository.findById(id)
  if (!atendimento) throw new AtendimentoNaoEncontradoError()

  const updateData: Record<string, unknown> = {}

  if (update.status) {
    updateData.status = update.status
  }

  if (update.resposta) {
    const novaEntrada: HistoricoItem = {
      de: attendantName,
      texto: update.resposta.texto,
      criadoEm: new Date().toISOString(),
    }
    const historicoAtual = (atendimento.historico ?? []) as unknown as HistoricoItem[]
    updateData.historico = [...historicoAtual, novaEntrada] as unknown as Prisma.InputJsonValue[]
  }

  const atualizado = await ticketsRepository.update(id, updateData)

  await logAudit({
    userId: attendantName,
    action: AUDIT_ACTIONS.ATENDIMENTO_ATUALIZADO,
    entity: 'Atendimento',
    entityId: id,
    details: { status: update.status ?? null, respondido: Boolean(update.resposta) },
    ip,
  })

  return atualizado
}
