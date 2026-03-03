'use client'

import { useState } from 'react'

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
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao se inscrever')
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-lg bg-brand-900/50 border border-brand-700/50 px-4 py-3 text-sm text-brand-200">
        Inscrição realizada! Você receberá nossas novidades por e-mail.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="Seu nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[44px]"
          aria-label="Nome para newsletter"
        />
        <input
          type="email"
          placeholder="Seu e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[44px]"
          aria-label="E-mail para newsletter"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-500 transition-colors disabled:opacity-50 min-h-[44px] shrink-0"
        >
          {status === 'loading' ? 'Enviando...' : 'Inscrever-se'}
        </button>
      </div>
      {status === 'error' && (
        <p className="text-sm text-red-400">{errorMsg}</p>
      )}
    </form>
  )
}

export { NewsletterForm }
