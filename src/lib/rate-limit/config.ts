/**
 * Configuração de rate limiting por endpoint.
 * window = janela em segundos, max = máximo de requisições na janela.
 */
export interface RateLimitConfig {
  window: number
  max: number
}

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Auth
  'auth/register': { window: 60, max: 5 },
  'auth/forgot-password': { window: 60, max: 3 },
  'auth/login': { window: 60, max: 10 },

  // Público
  contato: { window: 60, max: 5 },
  newsletter: { window: 60, max: 5 },
  'cnpj/lookup': { window: 60, max: 10 },

  // API v1 — por API key
  'v1:read': { window: 60, max: 60 },
  'v1:write': { window: 60, max: 20 },
}
