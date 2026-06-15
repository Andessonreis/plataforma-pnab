import type { Prisma } from '@prisma/client'
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

export function createAtendimento(data: CreateAtendimentoData) {
  const protocolo = `ATD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

  return ticketsRepository.create({
    protocolo,
    nomeContato: data.nomeContato,
    emailContato: data.emailContato,
    assunto: data.assunto,
    mensagem: data.mensagem,
    editalId: data.editalId ?? null,
    autorId: data.autorId ?? null,
    historico: [],
  })
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

  return ticketsRepository.update(id, updateData)
}
