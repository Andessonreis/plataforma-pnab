/**
 * Entry point do worker BullMQ.
 * Executar separadamente: npm run worker
 * Em produção, roda como serviço `worker` no docker-compose.yml
 */
import { emailWorker } from '@/lib/queue/workers/email.worker'
import { pdfWorker } from '@/lib/queue/workers/pdf.worker'
import { schedulerWorker } from '@/lib/queue/workers/scheduler.worker'
import { initSchedulerRepeatableJobs } from '@/lib/queue'

console.log('[Worker] Iniciado — aguardando jobs nas filas...')
console.log('[Worker] Filas ativas:', emailWorker.name, pdfWorker.name, schedulerWorker.name)

// Configura jobs repetíveis
initSchedulerRepeatableJobs().catch((err) => {
  console.error('[Worker] Falha ao configurar scheduler:', err)
})

const gracefulShutdown = async (signal: string) => {
  console.log(`[Worker] Recebido ${signal}, encerrando...`)
  await Promise.all([emailWorker.close(), pdfWorker.close(), schedulerWorker.close()])
  process.exit(0)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
