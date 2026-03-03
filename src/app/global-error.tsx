'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="pt-BR">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Algo deu errado
            </h1>
            <p className="text-slate-600 mb-6">
              Ocorreu um erro inesperado. Nossa equipe foi notificada.
            </p>
            <button
              onClick={reset}
              className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
