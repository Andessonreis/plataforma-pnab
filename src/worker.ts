/**
 * Entry point do worker BullMQ.
 * Executar separadamente: npm run worker
 * Em produção, roda como serviço `worker` no docker-compose.yml
 */
import 'dotenv/config'
import { emailWorker } from '@server/lib/queue/workers/email.worker'
import { pdfWorker } from '@server/lib/queue/workers/pdf.worker'
import { schedulerWorker } from '@server/lib/queue/workers/scheduler.worker'
import {
  notificationDispatchWorker,
  notificationDeliveryWorker,
} from '@server/lib/queue/workers/notification.worker'
import { initSchedulerRepeatableJobs } from '@server/lib/queue'

console.log('[Worker] Iniciado — aguardando jobs nas filas...')
console.log(
  '[Worker] Filas ativas:',
  emailWorker.name,
  pdfWorker.name,
  schedulerWorker.name,
  notificationDispatchWorker.name,
  notificationDeliveryWorker.name,
)

// Configura jobs repetíveis
initSchedulerRepeatableJobs().catch((err) => {
  console.error('[Worker] Falha ao configurar scheduler:', err)
})

const gracefulShutdown = async (signal: string) => {
  console.log(`[Worker] Recebido ${signal}, encerrando...`)
  await Promise.all([
    emailWorker.close(),
    pdfWorker.close(),
    schedulerWorker.close(),
    notificationDispatchWorker.close(),
    notificationDeliveryWorker.close(),
  ])
  process.exit(0)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
