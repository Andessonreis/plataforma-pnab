import { prisma } from '@/lib/db'
import { ServiceError } from './errors'
import type { TicketStatus, Prisma } from '@prisma/client'

interface CreateTicketData {
  nomeContato: string
  emailContato: string
  assunto: string
  mensagem: string
  editalId?: string
  autorId?: string
}

export async function createTicket(data: CreateTicketData) {
  const protocolo = `TKT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

  return prisma.ticket.create({
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

export async function listTickets(page: number, pageSize: number, status?: string) {
  const where = status ? { status: status as TicketStatus } : {}
  const [data, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { autor: { select: { nome: true, email: true } } },
    }),
    prisma.ticket.count({ where }),
  ])

  return { data, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } }
}

export async function getTicketById(id: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: { autor: { select: { nome: true, email: true } } },
  })
  if (!ticket) throw new ServiceError('NOT_FOUND', 'Ticket não encontrado.')
  return ticket
}

interface HistoricoItem {
  de: string
  texto: string
  criadoEm: string
}

export async function updateTicket(
  id: string,
  update: { status?: string; resposta?: { texto: string } },
  attendantName: string,
) {
  const ticket = await prisma.ticket.findUnique({ where: { id } })
  if (!ticket) throw new ServiceError('NOT_FOUND', 'Ticket não encontrado.')

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
    const historicoAtual = (ticket.historico ?? []) as unknown as HistoricoItem[]
    updateData.historico = [...historicoAtual, novaEntrada] as unknown as Prisma.InputJsonValue[]
  }

  return prisma.ticket.update({ where: { id }, data: updateData })
}
