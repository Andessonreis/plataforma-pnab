'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'pnab-cookie-consent'

type ConsentValue = 'all' | 'essential'

const BOTAO_BASE =
  'inline-flex min-h-[44px] items-center justify-center rounded-lg px-5 text-[0.9375rem] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700'

/**
 * Consentimento de cookies.
 *
 * O banner é montado no layout público, fora de qualquer `.tema-secult` — e é
 * ali que as variáveis de cor da Secretaria são definidas. Sem o tema no
 * escopo, `brand-600` caía no fallback genérico do Tailwind e o botão
 * principal saía verde-esmeralda, cor que não existe na identidade: a primeira
 * coisa que o cidadão vê ao abrir o portal era o único elemento fora da marca.
 * A classe entra aqui na raiz, e os tons passam a resolver para o terracota e
 * o creme da SECULT.
 */
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
      className="tema-secult fixed inset-x-0 bottom-0 z-50 p-4 font-questrial sm:p-6"
    >
      <div className="mx-auto max-w-4xl border-2 border-tinta-950/15 bg-papel-50 p-5 shadow-2xl shadow-tinta-950/20 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
          <div className="flex-1">
            <h2 className="titulo mb-1.5 text-lg leading-none tracking-wide text-tinta-900">
              Uso de cookies
            </h2>
            <p
              id="cookie-banner-description"
              className="text-[0.9375rem] leading-relaxed text-tinta-800"
            >
              Este portal usa cookies essenciais para funcionar e cookies de desempenho para
              melhorar sua experiência. Você pode aceitar todos ou seguir apenas com os
              essenciais. Detalhes na{' '}
              <Link
                href="/privacidade"
                className="font-semibold text-brand-700 underline underline-offset-4 transition-colors hover:text-brand-800"
              >
                Política de Privacidade
              </Link>
              .
            </p>
          </div>

          <div className="flex flex-col gap-2.5 sm:shrink-0 sm:flex-row">
            <button
              type="button"
              onClick={() => handleAccept('essential')}
              className={`${BOTAO_BASE} border-2 border-tinta-950/25 text-tinta-900 hover:bg-tinta-950/5`}
            >
              Apenas essenciais
            </button>
            <button
              type="button"
              onClick={() => handleAccept('all')}
              className={`${BOTAO_BASE} bg-brand-700 text-papel-50 hover:bg-brand-800`}
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
