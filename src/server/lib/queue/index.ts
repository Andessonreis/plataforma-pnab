import { Queue } from 'bullmq'
import { redis } from '@server/lib/redis'
import type { EmailTemplate } from '@server/lib/mail'
import type { NotificationChannel } from '@prisma/client'

// ─── Tipos de jobs ────────────────────────────────────────────────────────────

export interface EmailJobData {
  to: string
  /** Opcional — quando omitido, o template usa o assunto padrão (`defaultSubjectFor`). */
  subject?: string
  template: EmailTemplate
  data: Record<string, unknown>
}

export interface PdfJobData {
  tipo: 'comprovante' | 'lista_resultado' | 'declaracao'
  inscricaoId?: string
  editalId?: string
  outputPath: string
}

export interface SchedulerJobData {
  trigger: 'cron'
}

export interface NotificationDispatchJobData {
  campaignId: string
}

export interface NotificationDeliveryJobData {
  campaignId: string
  userId: string
  titulo: string
  corpo: string
  link: string | null
  ctaLabel: string | null
  canais: NotificationChannel[]
}

// ─── Filas ────────────────────────────────────────────────────────────────────

export const emailQueue = new Queue<EmailJobData>('email', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
})

export const pdfQueue = new Queue<PdfJobData>('pdf', {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 3000 },
    removeOnComplete: 50,
    removeOnFail: 200,
  },
})

export const schedulerQueue = new Queue<SchedulerJobData>('scheduler', {
  connection: redis,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: 10,
    removeOnFail: 50,
  },
})

export const notificationDispatchQueue = new Queue<NotificationDispatchJobData>(
  'notification-dispatch',
  {
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 50,
      removeOnFail: 200,
    },
  },
)

export const notificationDeliveryQueue = new Queue<NotificationDeliveryJobData>(
  'notification-delivery',
  {
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 500,
      removeOnFail: 1000,
    },
  },
)

// ─── Helpers para enfileirar jobs ─────────────────────────────────────────────

export async function enqueueEmail(data: EmailJobData) {
  return emailQueue.add('send', data)
}

/**
 * Enfileira um e-mail em modo fire-and-forget: falhas ao enfileirar são
 * logadas e engolidas para não derrubar o fluxo principal. `contextLabel`
 * identifica o módulo de origem no log (ex.: 'inscricao', 'habilitacao').
 */
export async function safeEnqueueEmail(data: EmailJobData, contextLabel: string) {
  try {
    await enqueueEmail(data)
  } catch {
    console.error(`[${contextLabel}] Falha ao enfileirar e-mail`)
  }
}

export async function enqueuePdf(data: PdfJobData) {
  return pdfQueue.add('generate', data)
}

export async function enqueueCampaignDispatch(data: NotificationDispatchJobData) {
  return notificationDispatchQueue.add('dispatch', data, {
    // jobId garante idempotência: re-enqueue da mesma campanha não cria job duplicado.
    jobId: `dispatch-${data.campaignId}`,
  })
}

export async function enqueueNotificationDelivery(data: NotificationDeliveryJobData) {
  return notificationDeliveryQueue.add('deliver', data, {
    jobId: `delivery-${data.campaignId}-${data.userId}`,
  })
}

/**
 * Configura o job repetível do scheduler.
 * Intervalo configurável via SCHEDULER_INTERVAL_MS (padrão: 1 min em dev, 30 min em prod).
 * Seguro chamar múltiplas vezes — BullMQ deduplica por jobId.
 */
export async function initSchedulerRepeatableJobs() {
  const defaultInterval = process.env.NODE_ENV === 'production' ? 10 * 60 * 1000 : 60 * 1000
  const interval = Number(process.env.SCHEDULER_INTERVAL_MS) || defaultInterval

  await schedulerQueue.upsertJobScheduler(
    'edital-status-check',
    { every: interval },
    { name: 'check', data: { trigger: 'cron' as const } },
  )
  console.log(`[Queue] Scheduler configurado — verificação a cada ${Math.round(interval / 1000)}s`)
}
