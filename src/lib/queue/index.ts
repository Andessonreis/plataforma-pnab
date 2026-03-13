import { Queue } from 'bullmq'
import { redis } from '@/lib/redis'
import type { EmailTemplate } from '@/lib/mail'

// ─── Tipos de jobs ────────────────────────────────────────────────────────────

export interface EmailJobData {
  to: string
  subject: string
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

// ─── Helpers para enfileirar jobs ─────────────────────────────────────────────

export async function enqueueEmail(data: EmailJobData) {
  return emailQueue.add('send', data)
}

export async function enqueuePdf(data: PdfJobData) {
  return pdfQueue.add('generate', data)
}

/**
 * Configura o job repetível do scheduler.
 * Intervalo configurável via SCHEDULER_INTERVAL_MS (padrão: 1 min em dev, 30 min em prod).
 * Seguro chamar múltiplas vezes — BullMQ deduplica por jobId.
 */
export async function initSchedulerRepeatableJobs() {
  const defaultInterval = process.env.NODE_ENV === 'production' ? 30 * 60 * 1000 : 60 * 1000
  const interval = Number(process.env.SCHEDULER_INTERVAL_MS) || defaultInterval

  await schedulerQueue.upsertJobScheduler(
    'edital-status-check',
    { every: interval },
    { name: 'check', data: { trigger: 'cron' as const } },
  )
  console.log(`[Queue] Scheduler configurado — verificação a cada ${Math.round(interval / 1000)}s`)
}
