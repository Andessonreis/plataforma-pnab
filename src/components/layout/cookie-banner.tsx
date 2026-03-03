'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'pnab-cookie-consent'

type ConsentValue = 'all' | 'essential'

function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Verifica se o usuario ja deu consentimento
    const consent = localStorage.getItem(STORAGE_KEY)
    if (!consent) {
      setVisible(true)
    }
  }, [])

  function handleAccept(value: ConsentValue) {
    localStorage.setItem(STORAGE_KEY, value)
    setVisible(false)
  }

  if (!visible) {
    return null
  }

  return (
    <div
      role="dialog"
      aria-label="Consentimento de cookies"
      aria-describedby="cookie-banner-description"
      className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6"
    >
      <div className="mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
          {/* Texto */}
          <div className="flex-1">
            <h2 className="text-base font-semibold text-slate-900 mb-1">
              Uso de cookies
            </h2>
            <p
              id="cookie-banner-description"
              className="text-sm text-slate-600 leading-relaxed"
            >
              Este portal utiliza cookies essenciais para seu funcionamento
              e cookies de desempenho para melhorar sua experiencia. Ao
              clicar em &ldquo;Aceitar todos&rdquo;, voce consente com o
              uso de todos os cookies. Voce pode optar por aceitar apenas
              os essenciais. Saiba mais em nossa{' '}
              <Link
                href="/privacidade"
                className="text-brand-600 hover:text-brand-700 underline font-medium"
              >
                Politica de Privacidade
              </Link>
              .
            </p>
          </div>

          {/* Botoes */}
          <div className="flex flex-col sm:flex-row gap-2 sm:shrink-0">
            <button
              type="button"
              onClick={() => handleAccept('essential')}
              className="inline-flex items-center justify-center rounded-lg border-2 border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors min-h-[44px] min-w-[44px]"
            >
              Apenas essenciais
            </button>
            <button
              type="button"
              onClick={() => handleAccept('all')}
              className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors shadow-sm min-h-[44px] min-w-[44px]"
            >
              Aceitar todos
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export { CookieBanner }
