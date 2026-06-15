import { Worker } from 'bullmq'
import { redis } from '@server/lib/redis'
import type { EmailJobData } from '@server/lib/queue'

export const emailWorker = new Worker<EmailJobData>(
  'email',
  async (job) => {
    const { to, subject, template, data } = job.data

    console.log(`[EmailWorker] Enviando "${template}" (job ${job.id})`)

    // Importação lazy para evitar ciclo de dependência circular
    const { sendEmail } = await import('@server/lib/mail')
    await sendEmail({ to, subject, template, data })

    console.log(`[EmailWorker] E-mail enviado com sucesso (job ${job.id})`)
  },
  {
    connection: redis,
    concurrency: 5,
  },
)

emailWorker.on('failed', (job, err) => {
  console.error(`[EmailWorker] Job ${job?.id} falhou:`, err.message)
})

emailWorker.on('completed', (job) => {
  console.log(`[EmailWorker] Job ${job.id} concluído`)
})
