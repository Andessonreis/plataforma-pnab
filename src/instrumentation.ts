/**
 * Next.js Instrumentation hook.
 *
 * Roda no startup de cada runtime (nodejs e edge).
 * - `register()`: inicialização geral (roda uma vez no boot)
 * - `onRequestError()`: capturado por qualquer exception não tratada
 *   em routes/server components/actions. É o equivalente self-hosted
 *   ao que o Sentry faz — persiste o erro na nossa tabela ErrorLog.
 *
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Handlers globais de último recurso — algo que escapou do Next
    process.on('uncaughtException', async (err) => {
      try {
        const { captureError } = await import('@/lib/errors/capture')
        await captureError(err, { extra: { origin: 'uncaughtException' } })
      } catch {
        // silencioso — já estamos em rota de falha global
      }
    })

    process.on('unhandledRejection', async (reason) => {
      try {
        const { captureError } = await import('@/lib/errors/capture')
        const err = reason instanceof Error ? reason : new Error(String(reason))
        await captureError(err, { extra: { origin: 'unhandledRejection' } })
      } catch {
        // silencioso
      }
    })
  }
}

/**
 * Capturado pelo Next 15 em qualquer exception não tratada nas fronteiras
 * de request (route handlers, server components, server actions, middleware).
 *
 * `err` é o Error original, `request` tem URL/método/headers e `context`
 * indica se é 'route-handler' | 'server-component' | 'server-action' | ...
 */
export async function onRequestError(
  err: { digest?: string } & Error,
  request: {
    path: string
    method: string
    headers: Record<string, string | string[] | undefined>
  },
  context: {
    routerKind: 'Pages Router' | 'App Router'
    routePath: string
    routeType: 'render' | 'route' | 'action' | 'middleware'
    renderSource?: 'react-server-components' | 'react-server-components-payload' | 'server-rendering'
    revalidateReason?: 'on-demand' | 'stale'
    renderType?: 'dynamic' | 'dynamic-resume'
  },
) {
  // captureError usa node:crypto e prisma — só roda em runtime Node
  if (process.env.NEXT_RUNTIME && process.env.NEXT_RUNTIME !== 'nodejs') return

  try {
    const { captureError } = await import('@/lib/errors/capture')

    const headers = request.headers
    const ua = typeof headers['user-agent'] === 'string' ? headers['user-agent'] : undefined
    const rawXff = headers['x-forwarded-for']
    const xff = Array.isArray(rawXff) ? rawXff[0] : rawXff
    const ip = typeof xff === 'string' ? xff.split(',')[0]?.trim() : undefined
    const rawRid = headers['x-request-id']
    const requestId = typeof rawRid === 'string' ? rawRid : undefined

    await captureError(err, {
      requestId,
      path: request.path,
      method: request.method,
      userAgent: ua,
      ip,
      extra: {
        routerKind: context.routerKind,
        routePath: context.routePath,
        routeType: context.routeType,
        ...(context.renderSource ? { renderSource: context.renderSource } : {}),
        ...(err.digest ? { digest: err.digest } : {}),
      },
    })
  } catch {
    // Último recurso: log mínimo pra não perder visibilidade
    console.error('[instrumentation] Falha ao capturar:',
      err instanceof Error ? err.message : 'Unknown')
  }
}
