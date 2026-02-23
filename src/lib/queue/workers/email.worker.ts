import { Worker } from 'bullmq'
import { redis } from '@/lib/redis'
import { transporter } from '@/lib/mail'
import type { EmailJobData } from '@/lib/queue'

export const emailWorker = new Worker<EmailJobData>(
  'email',
  async (job) => {
    const { to, subject, template, data } = job.data

    console.log(`[EmailWorker] Enviando "${template}" para ${to} (job ${job.id})`)

    // Importação lazy para evitar ciclo de dependência circular
    const { sendEmail } = await import('@/lib/mail')
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
