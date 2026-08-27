'use client'

import { useState } from 'react'

const CAMPO =
  'h-11 w-full rounded-md border border-papel-100/20 bg-papel-100/[0.06] px-3 text-[0.9375rem] text-papel-50 placeholder:text-papel-200/40 transition-colors focus:border-accent-300 focus:outline-none focus:ring-2 focus:ring-accent-300/40'

const ROTULO = 'mb-1 block text-sm text-papel-200/80'

/**
 * Assinatura da lista de avisos, no rodapé.
 *
 * Os dois campos eram só placeholder cinza de 12px sobre um fundo branco
 * translúcido — some ao começar a digitar, e o rótulo real ficava escondido no
 * `aria-label`, visível apenas para leitor de tela. Num portal cujo público tem
 * muita gente idosa, isso deixa quem enxerga pouco sem saber o que já preencheu.
 * Rótulo visível acima de cada campo, corpo em 15px e altura de 44px, que é o
 * alvo mínimo de toque exigido no projeto.
 */
function NewsletterForm() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Erro ao se inscrever')
      }

      setStatus('success')
      setNome('')
      setEmail('')

      // Volta ao estado inicial após 5 segundos
      setTimeout(() => setStatus('idle'), 5000)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao se inscrever')
    }
  }

  if (status === 'success') {
    return (
      <p
        className="text-[0.9375rem] leading-relaxed text-papel-50"
        role="status"
      >
        Pronto. Vamos avisar você por e-mail quando abrir edital novo.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm">
      <div className="space-y-3">
        <div>
          <label htmlFor="newsletter-nome" className={ROTULO}>
            Seu nome
          </label>
          <input
            id="newsletter-nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            className={CAMPO}
          />
        </div>

        <div>
          <label htmlFor="newsletter-email" className={ROTULO}>
            Seu e-mail
          </label>
          <input
            id="newsletter-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="nome@exemplo.com"
            className={CAMPO}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="mt-4 h-11 rounded-md bg-accent-500 px-5 text-[0.9375rem] font-semibold text-tinta-950 transition-colors hover:bg-accent-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-300 disabled:opacity-60"
      >
        {status === 'loading' ? 'Enviando…' : 'Quero receber'}
      </button>

      {status === 'error' && (
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-red-300" role="alert">
          {errorMsg}
        </p>
      )}
    </form>
  )
}

export { NewsletterForm }
