import { Worker } from 'bullmq'
import { redis } from '@/lib/redis'
import { prisma } from '@/lib/db'
import {
  enqueueEmail,
  enqueueNotificationDelivery,
  type NotificationDispatchJobData,
  type NotificationDeliveryJobData,
} from '@/lib/queue'
import { resolveAudience } from '@/lib/notifications/audience'
import type { AudienceFilter } from '@/lib/notifications/types'
import type { NotificationRuleTrigger } from '@prisma/client'

const SITE_URL_FALLBACK = process.env.NEXT_PUBLIC_SITE_URL || 'https://culturaeturismo.irece.ba.gov.br'

// Regras cuja natureza é "lembrete de ação pendente" — usam o template
// notificacao_prazo em vez do genérico. Ex.: EDITAL_PUBLICADO é um anúncio,
// não um lembrete, então fica de fora e segue em notificacao_generica.
const TRIGGERS_LEMBRETE_PRAZO = new Set<NotificationRuleTrigger>([
  'INSCRICAO_RASCUNHO_PENDENTE',
  'USER_SEM_INSCRICAO',
  'INSCRICAO_ANEXOS_FALTANDO',
  'EDITAL_PRAZO_ENCERRANDO',
  'RECURSO_PRAZO_ENCERRANDO',
])

// ─── Worker: dispatch-campaign ──────────────────────────────────────────────
// Resolve a audiência da campanha e enfileira 1 job de delivery por usuário.

export const notificationDispatchWorker = new Worker<NotificationDispatchJobData>(
  'notification-dispatch',
  async (job) => {
    const { campaignId } = job.data

    const campaign = await prisma.notificationCampaign.findUnique({
      where: { id: campaignId },
      include: { rule: { select: { trigger: true } } },
    })

    if (!campaign) {
      console.warn(`[NotificationDispatch] Campanha ${campaignId} não encontrada — skip`)
      return
    }

    // Permite reprocessar campanhas em ENVIANDO (retry após falha). Bloqueia ENVIADA/CANCELADA/FALHA.
    if (campaign.status !== 'RASCUNHO' && campaign.status !== 'ENVIANDO') {
      console.log(
        `[NotificationDispatch] Campanha ${campaignId} em status ${campaign.status} — skip`,
      )
      return
    }

    if (campaign.status === 'RASCUNHO') {
      await prisma.notificationCampaign.update({
        where: { id: campaignId },
        data: { status: 'ENVIANDO' },
      })
    }

    const filtro = (campaign.filtro ?? {}) as AudienceFilter
    const userIds = await resolveAudience(filtro)

    await prisma.notificationCampaign.update({
      where: { id: campaignId },
      data: { totalAlvo: userIds.length },
    })

    console.log(
      `[NotificationDispatch] Campanha ${campaignId} → ${userIds.length} destinatários`,
    )

    for (const userId of userIds) {
      await enqueueNotificationDelivery({
        campaignId,
        userId,
        ruleTrigger: campaign.rule?.trigger ?? null,
        titulo: campaign.assunto,
        corpo: campaign.corpo,
        link: campaign.link,
        ctaLabel: campaign.ctaLabel,
        canais: campaign.canais,
      })
    }

    await prisma.notificationCampaign.update({
      where: { id: campaignId },
      data: { status: 'ENVIADA', sentAt: new Date() },
    })

    console.log(`[NotificationDispatch] Campanha ${campaignId} marcada como ENVIADA`)
  },
  { connection: redis, concurrency: 2 },
)

notificationDispatchWorker.on('failed', async (job, err) => {
  console.error(`[NotificationDispatch] Job ${job?.id} falhou:`, err.message)
  // Se esgotou tentativas, marca campanha como FALHA
  if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
    try {
      await prisma.notificationCampaign.update({
        where: { id: job.data.campaignId },
        data: { status: 'FALHA' },
      })
    } catch {
      // ignore — campanha pode já ter sido excluída
    }
  }
})

// ─── Worker: deliver-notification ───────────────────────────────────────────
// Cria 1 Notification (idempotente via @@unique). Se canal EMAIL e flag ligada,
// enfileira email.

export const notificationDeliveryWorker = new Worker<NotificationDeliveryJobData>(
  'notification-delivery',
  async (job) => {
    const { campaignId, userId, ruleTrigger, titulo, corpo, link, ctaLabel, canais } = job.data

    const emailEnabled = process.env.NOTIFICATION_EMAIL_ENABLED === 'true'
    const shouldSendEmail = canais.includes('EMAIL') && emailEnabled
    const emailDisabledReason =
      canais.includes('EMAIL') && !emailEnabled ? 'NOTIFICATION_EMAIL_ENABLED=false' : null

    // Upsert garante idempotência: re-execução do mesmo job não duplica
    const notif = await prisma.notification.upsert({
      where: { campaignId_userId: { campaignId, userId } },
      create: {
        userId,
        campaignId,
        titulo,
        corpo,
        link,
        ctaLabel,
        canais,
        emailErro: emailDisabledReason,
      },
      update: {},
    })

    // Increment seguro do contador (concorrência tratada pelo Prisma)
    await prisma.notificationCampaign.update({
      where: { id: campaignId },
      data: { totalEnviado: { increment: 1 } },
    })

    if (shouldSendEmail && !notif.emailEnviadoEm) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, nome: true },
        })

        if (!user?.email) {
          await prisma.notification.update({
            where: { id: notif.id },
            data: { emailErro: 'user sem email' },
          })
          return
        }

        if (ruleTrigger && TRIGGERS_LEMBRETE_PRAZO.has(ruleTrigger)) {
          // Regras de "lembrete de ação pendente" usam o template dedicado —
          // mais enxuto que o corpo HTML livre das campanhas manuais. Outras
          // regras (ex.: edital publicado) continuam em notificacao_generica.
          await enqueueEmail({
            to: user.email,
            subject: titulo,
            template: 'notificacao_prazo',
            data: {
              mensagem: corpo.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
              url: link || SITE_URL_FALLBACK,
            },
          })
        } else {
          await enqueueEmail({
            to: user.email,
            subject: titulo,
            template: 'notificacao_generica',
            data: {
              nome: user.nome ?? '',
              titulo,
              corpo,
              link: link ?? '',
              ctaLabel: ctaLabel ?? '',
            },
          })
        }

        await prisma.notification.update({
          where: { id: notif.id },
          data: { emailEnviadoEm: new Date(), emailErro: null },
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'erro desconhecido'
        await prisma.notification.update({
          where: { id: notif.id },
          data: { emailErro: msg },
        })
        await prisma.notificationCampaign.update({
          where: { id: campaignId },
          data: { totalErro: { increment: 1 } },
        })
        throw err // deixa BullMQ retentar
      }
    }
  },
  { connection: redis, concurrency: 10 },
)

notificationDeliveryWorker.on('failed', (job, err) => {
  console.error(`[NotificationDelivery] Job ${job?.id} falhou:`, err.message)
})

notificationDeliveryWorker.on('completed', (job) => {
  if (job.attemptsMade > 1) {
    console.log(`[NotificationDelivery] Job ${job.id} concluído após ${job.attemptsMade} tentativa(s)`)
  }
})
