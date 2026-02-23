import Redis from 'ioredis'

const getRedisUrl = () => {
  if (process.env.REDIS_URL) return process.env.REDIS_URL
  return `redis://${process.env.REDIS_HOST ?? 'localhost'}:${process.env.REDIS_PORT ?? 6379}`
}

// maxRetriesPerRequest: null é obrigatório para BullMQ
export const redis = new Redis(getRedisUrl(), {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
})

redis.on('error', (err) => {
  console.error('[Redis] Erro de conexão:', err)
})
