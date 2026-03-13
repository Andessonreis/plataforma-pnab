import Redis from 'ioredis'

const getRedisUrl = () => {
  if (process.env.REDIS_URL) return process.env.REDIS_URL
  return `redis://${process.env.REDIS_HOST ?? 'localhost'}:${process.env.REDIS_PORT ?? 6379}`
}

// ── Inicialização lazy — evita conexão durante `next build` ─────────────
// Durante o build do Docker, o hostname `pnab-redis` não existe.
// O Proxy garante que a conexão só é criada quando alguém chama um método.

let _instance: Redis | null = null

function getInstance(): Redis {
  if (!_instance) {
    _instance = new Redis(getRedisUrl(), {
      maxRetriesPerRequest: null, // obrigatório para BullMQ
      enableReadyCheck: false,
      lazyConnect: true, // só conecta no primeiro comando, não no new Redis()
    })
    _instance.on('error', (err) => {
      console.error('[Redis] Erro de conexão:', err)
    })
  }
  return _instance
}

export const redis: Redis = new Proxy({} as Redis, {
  get(_, prop: string | symbol) {
    const instance = getInstance()
    const value = Reflect.get(instance, prop, instance)
    return typeof value === 'function' ? value.bind(instance) : value
  },
})
