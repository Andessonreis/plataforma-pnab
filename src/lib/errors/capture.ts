import { prisma } from '@/lib/db'

/**
 * FNV-1a 64-bit — hash não-criptográfico, determinístico e compatível
 * com Node e Edge runtime (nenhuma dependência nativa).
 * Só usamos pra agrupar erros "iguais" no ErrorLog.
 */
function fnv1a64(input: string): string {
  let h = 14695981039346656037n
  const prime = 1099511628211n
  const mask = 0xffffffffffffffffn
  for (let i = 0; i < input.length; i++) {
    h ^= BigInt(input.charCodeAt(i))
    h = (h * prime) & mask
  }
  return h.toString(16).padStart(16, '0')
}

/**
 * Contexto capturado junto com o erro. Nunca inclua dados sensíveis
 * (senhas, tokens) — o helper sanitiza mas é melhor evitar na fonte.
 */
export interface ErrorContext {
  requestId?: string
  userId?: string
  path?: string
  method?: string
  statusCode?: number
  userAgent?: string
  ip?: string
  level?: 'error' | 'warn'
  extra?: Record<string, unknown>
}

const MAX_STACK_LENGTH = 10_000
const MAX_MESSAGE_LENGTH = 2_000

/** Campos cujos valores são ofuscados antes de persistir */
const SENSITIVE_KEY_PATTERN = /password|senha|token|authorization|cookie|secret|api[_-]?key|session/i

/**
 * Gera um fingerprint determinístico para agrupar erros "iguais".
 * Baseado em: nome do erro + primeiras 3 linhas úteis do stack
 * (excluindo node_modules, pra agrupar por ponto da nossa aplicação).
 */
export function computeFingerprint(err: Error): string {
  const name = err.name || 'Error'
  const stackLines = (err.stack ?? err.message ?? '').split('\n')
  const appFrames = stackLines
    .map((l) => l.trim())
    .filter((l) => l.startsWith('at '))
    .filter((l) => !l.includes('node_modules'))
    .slice(0, 3)

  const signature = [name, err.message?.slice(0, 200), ...appFrames].join('|')
  return fnv1a64(signature)
}

/**
 * Sanitiza um objeto removendo/ofuscando valores de chaves sensíveis.
 * Recursivo, limitado a 3 níveis de profundidade pra evitar ciclos.
 */
export function sanitize(obj: unknown, depth = 0): unknown {
  if (depth > 3 || obj === null || obj === undefined) return obj
  if (typeof obj !== 'object') return obj

  if (Array.isArray(obj)) {
    return obj.slice(0, 50).map((v) => sanitize(v, depth + 1))
  }

  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_KEY_PATTERN.test(k)) {
      out[k] = '[REDACTED]'
    } else {
      out[k] = sanitize(v, depth + 1)
    }
  }
  return out
}

/**
 * Persiste um erro no banco. Nunca lança — falha em log nunca pode
 * derrubar o fluxo principal.
 */
export async function captureError(
  err: unknown,
  ctx: ErrorContext = {},
): Promise<void> {
  try {
    const error = err instanceof Error ? err : new Error(String(err))
    const message = (error.message || 'Unknown error').slice(0, MAX_MESSAGE_LENGTH)
    const stack = error.stack?.slice(0, MAX_STACK_LENGTH) ?? null
    const fingerprint = computeFingerprint(error)
    const level = ctx.level ?? 'error'

    const context = ctx.extra ? (sanitize(ctx.extra) as Record<string, unknown>) : null

    await prisma.errorLog.create({
      data: {
        level,
        message,
        stack,
        fingerprint,
        requestId: ctx.requestId ?? null,
        userId: ctx.userId ?? null,
        path: ctx.path ?? null,
        method: ctx.method ?? null,
        statusCode: ctx.statusCode ?? null,
        userAgent: ctx.userAgent ? ctx.userAgent.slice(0, 500) : null,
        ip: ctx.ip ?? null,
        context: context as never,
      },
    })
  } catch (persistErr) {
    // Última linha de defesa: log pro stdout se não conseguir persistir
    console.error('[captureError] Falha ao persistir erro:',
      persistErr instanceof Error ? persistErr.message : 'Unknown')
    console.error('[captureError] Erro original:',
      err instanceof Error ? `${err.name}: ${err.message}` : String(err))
  }
}
