/**
 * Entry point do worker BullMQ.
 * Executar separadamente: npm run worker
 * Em produção, roda como serviço `worker` no docker-compose.yml
 */
import { emailWorker } from '@/lib/queue/workers/email.worker'

console.log('[Worker] Iniciado — aguardando jobs nas filas...')
console.log('[Worker] Filas ativas:', emailWorker.name)

const gracefulShutdown = async (signal: string) => {
  console.log(`[Worker] Recebido ${signal}, encerrando...`)
  await emailWorker.close()
  process.exit(0)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
