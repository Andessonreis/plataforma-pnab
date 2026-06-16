import type { Prisma } from '@prisma/client'
import { logAudit, AUDIT_ACTIONS } from '@server/lib/audit'
import { enqueueCampaignDispatch } from '@server/lib/queue'
import { countAudience } from '@server/lib/notifications/audience'
import type { AudienceFilter } from '@server/lib/notifications/types'
import type { CampaignInput } from '@shared/schemas/notifications.schema'
import type { PaginationMeta } from '@shared/dtos/common.dto'
import { campanhasRepository } from './campanhas.repository'
import {
  AudienciaVaziaError,
  CampanhaComEntregasError,
  CampanhaJaFinalizadaError,
  CampanhaNaoDisparavelError,
  CampanhaNaoEditavelError,
  CampanhaNaoEncontradaError,
  CampanhaNaoExcluivelError,
} from '../errors/notificacoes.errors'

type CampaignStatus = 'RASCUNHO' | 'ENVIANDO' | 'ENVIADA' | 'CANCELADA' | 'FALHA'

export async function listCampanhas(params: {
  page: number
  pageSize: number
  status?: CampaignStatus
}) {
  const { page, pageSize, status } = params
  const where = status ? { status } : {}
  const [data, total] = await campanhasRepository.listPaginated({ page, pageSize, where })
  const meta: PaginationMeta = {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  }
  return { data, meta }
}

export async function getCampanha(id: string) {
  const campaign = await campanhasRepository.findDetail(id)
  if (!campaign) throw new CampanhaNaoEncontradaError()
  return campaign
}

export async function createCampanha(data: CampaignInput, userId: string, ip?: string) {
  const campaign = await campanhasRepository.create({
    tipo: 'MANUAL',
    status: 'RASCUNHO',
    titulo: data.titulo,
    assunto: data.assunto,
    corpo: data.corpo,
    link: data.link ?? null,
    ctaLabel: data.ctaLabel ?? null,
    canais: data.canais,
    filtro: data.filtro as Prisma.InputJsonValue,
    createdById: userId,
  })

  await logAudit({
    userId,
    action: AUDIT_ACTIONS.NOTIFICACAO_CAMPANHA_CRIADA,
    entity: 'NotificationCampaign',
    entityId: campaign.id,
    details: { titulo: campaign.titulo, canais: campaign.canais },
    ip,
  })

  return campaign
}

export async function updateCampanha(
  id: string,
  data: CampaignInput,
  userId: string,
  ip?: string,
) {
  const existing = await campanhasRepository.findById(id)
  if (!existing) throw new CampanhaNaoEncontradaError()
  if (existing.status !== 'RASCUNHO') throw new CampanhaNaoEditavelError()

  const campaign = await campanhasRepository.update(id, {
    titulo: data.titulo,
    assunto: data.assunto,
    corpo: data.corpo,
    link: data.link ?? null,
    ctaLabel: data.ctaLabel ?? null,
    canais: data.canais,
    filtro: data.filtro as Prisma.InputJsonValue,
  })

  await logAudit({
    userId,
    action: AUDIT_ACTIONS.NOTIFICACAO_CAMPANHA_ATUALIZADA,
    entity: 'NotificationCampaign',
    entityId: campaign.id,
    details: { titulo: campaign.titulo },
    ip,
  })

  return campaign
}

export async function deleteCampanha(id: string, userId: string, ip?: string) {
  const existing = await campanhasRepository.findById(id)
  if (!existing) throw new CampanhaNaoEncontradaError()
  if (existing.status !== 'RASCUNHO' && existing.status !== 'FALHA') {
    throw new CampanhaNaoExcluivelError()
  }

  await campanhasRepository.delete(id)

  await logAudit({
    userId,
    action: AUDIT_ACTIONS.NOTIFICACAO_CAMPANHA_EXCLUIDA,
    entity: 'NotificationCampaign',
    entityId: id,
    details: { titulo: existing.titulo },
    ip,
  })
}

export async function sendCampanha(id: string, userId: string, ip?: string) {
  const campaign = await campanhasRepository.findById(id)
  if (!campaign) throw new CampanhaNaoEncontradaError()
  if (campaign.status !== 'RASCUNHO') throw new CampanhaNaoDisparavelError()

  const totalAlvo = await countAudience((campaign.filtro ?? {}) as AudienceFilter)
  if (totalAlvo === 0) throw new AudienciaVaziaError()

  await enqueueCampaignDispatch({ campaignId: campaign.id })

  await logAudit({
    userId,
    action: AUDIT_ACTIONS.NOTIFICACAO_CAMPANHA_DISPARADA,
    entity: 'NotificationCampaign',
    entityId: campaign.id,
    details: {
      titulo: campaign.titulo,
      totalAlvo,
      canais: campaign.canais,
      filtro: campaign.filtro,
    },
    ip,
  })

  return { id: campaign.id, totalAlvo }
}

export async function cancelCampanha(id: string, userId: string, ip?: string) {
  const campaign = await campanhasRepository.findById(id)
  if (!campaign) throw new CampanhaNaoEncontradaError()

  if (campaign.status === 'ENVIADA' || campaign.status === 'CANCELADA') {
    throw new CampanhaJaFinalizadaError()
  }
  if (campaign.totalEnviado > 0) {
    throw new CampanhaComEntregasError(campaign.totalEnviado)
  }

  await campanhasRepository.update(id, { status: 'CANCELADA' })

  await logAudit({
    userId,
    action: AUDIT_ACTIONS.NOTIFICACAO_CAMPANHA_CANCELADA,
    entity: 'NotificationCampaign',
    entityId: id,
    details: { titulo: campaign.titulo, statusAnterior: campaign.status },
    ip,
  })
}

export async function previewCampanhaAudience(id: string) {
  const campaign = await campanhasRepository.findFiltro(id)
  if (!campaign) throw new CampanhaNaoEncontradaError()
  return countAudience((campaign.filtro ?? {}) as AudienceFilter)
}
