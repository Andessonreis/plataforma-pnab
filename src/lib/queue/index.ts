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

// ─── Helpers para enfileirar jobs ─────────────────────────────────────────────

export async function enqueueEmail(data: EmailJobData) {
  return emailQueue.add('send', data)
}

export async function enqueuePdf(data: PdfJobData) {
  return pdfQueue.add('generate', data)
}
