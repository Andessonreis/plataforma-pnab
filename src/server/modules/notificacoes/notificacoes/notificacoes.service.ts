import type { Prisma } from '@prisma/client'
import { renderTemplate } from '@server/lib/mail/render'
import { notificacoesRepository } from './notificacoes.repository'

type LidaFilter = 'true' | 'false' | undefined

function lidaWhere(lida: LidaFilter): Prisma.NotificationWhereInput {
  if (lida === 'true') return { lidaEm: { not: null } }
  if (lida === 'false') return { lidaEm: null }
  return {}
}

export async function listNotificacoesAdmin(params: {
  page: number
  pageSize: number
  userId?: string
  campaignId?: string
  lida?: LidaFilter
}) {
  const { page, pageSize, userId, campaignId, lida } = params
  const where: Prisma.NotificationWhereInput = { ...lidaWhere(lida) }
  if (userId) where.userId = userId
  if (campaignId) where.campaignId = campaignId

  const [data, total] = await notificacoesRepository.listForAdmin({ page, pageSize, where })
  return {
    data,
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  }
}

export async function listNotificacoesUser(params: {
  userId: string
  page: number
  pageSize: number
  lida?: LidaFilter
}) {
  const { userId, page, pageSize, lida } = params
  const where: Prisma.NotificationWhereInput = { userId, ...lidaWhere(lida) }

  const [data, total, totalUnread] = await notificacoesRepository.listForUser({
    userId,
    page,
    pageSize,
    where,
  })
  return {
    data,
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize), totalUnread },
  }
}

export function countUnread(userId: string) {
  return notificacoesRepository.countUnread(userId)
}

export async function markRead(id: string, userId: string) {
  const result = await notificacoesRepository.markRead(id, userId)
  return result.count
}

export async function markAllRead(userId: string) {
  const result = await notificacoesRepository.markAllRead(userId)
  return result.count
}

export async function previewNotificacao(input: {
  titulo?: string
  corpo?: string
  link?: string
  ctaLabel?: string
}) {
  const titulo = input.titulo?.trim() || 'Título da notificação'
  const corpo =
    input.corpo?.trim() ||
    '<p style="color:#94a3b8">O corpo da mensagem aparece aqui conforme você digita.</p>'

  const { html } = await renderTemplate('notificacao_generica', {
    titulo,
    corpo,
    nome: 'Ana (exemplo)',
    link: input.link?.trim() || undefined,
    ctaLabel: input.ctaLabel?.trim() || undefined,
  })

  return {
    emailHtml: html,
    inApp: {
      titulo,
      corpo: input.corpo?.trim() || '',
      link: input.link?.trim() || null,
      ctaLabel: input.ctaLabel?.trim() || null,
    },
  }
}
