import { prisma } from '@/lib/db'
import { ServiceError } from './errors'
import type { AtendimentoStatus, Prisma } from '@prisma/client'

interface CreateAtendimentoData {
  nomeContato: string
  emailContato: string
  assunto: string
  mensagem: string
  editalId?: string
  autorId?: string
}

export async function createAtendimento(data: CreateAtendimentoData) {
  const protocolo = `ATD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

  return prisma.atendimento.create({
    data: {
      protocolo,
      nomeContato: data.nomeContato,
      emailContato: data.emailContato,
      assunto: data.assunto,
      mensagem: data.mensagem,
      editalId: data.editalId ?? null,
      autorId: data.autorId ?? null,
      historico: [],
    },
  })
}

export async function listAtendimentos(page: number, pageSize: number, status?: string) {
  const where = status ? { status: status as AtendimentoStatus } : {}
  const [data, total] = await Promise.all([
    prisma.atendimento.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { autor: { select: { nome: true, email: true } } },
    }),
    prisma.atendimento.count({ where }),
  ])

  return { data, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } }
}

export async function getAtendimentoById(id: string) {
  const atendimento = await prisma.atendimento.findUnique({
    where: { id },
    include: { autor: { select: { nome: true, email: true } } },
  })
  if (!atendimento) throw new ServiceError('NOT_FOUND', 'Atendimento não encontrado.')
  return atendimento
}

interface HistoricoItem {
  de: string
  texto: string
  criadoEm: string
}

export async function updateAtendimento(
  id: string,
  update: { status?: string; resposta?: { texto: string } },
  attendantName: string,
) {
  const atendimento = await prisma.atendimento.findUnique({ where: { id } })
  if (!atendimento) throw new ServiceError('NOT_FOUND', 'Atendimento não encontrado.')

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

  return prisma.atendimento.update({ where: { id }, data: updateData })
}
