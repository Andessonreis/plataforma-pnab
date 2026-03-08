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

      // Volta ao estado inicial após 5 segundos
      setTimeout(() => setStatus('idle'), 5000)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao se inscrever')
    }
  }

  if (status === 'success') {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-brand-900/50 border border-brand-700/50 px-4 py-2.5 text-sm text-brand-200">
        <svg className="h-4 w-4 shrink-0 text-brand-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Inscrição realizada! Você receberá nossas novidades por e-mail.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="Seu nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 h-9"
          aria-label="Nome para newsletter"
        />
        <input
          type="email"
          placeholder="Seu e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 h-9"
          aria-label="E-mail para newsletter"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="rounded-md bg-brand-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-brand-500 transition-colors disabled:opacity-50 h-9 shrink-0"
        >
          {status === 'loading' ? 'Enviando...' : 'Inscrever-se'}
        </button>
      </div>
      {status === 'error' && (
        <p className="flex items-center gap-1.5 text-xs text-red-400" role="alert">
          <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {errorMsg}
        </p>
      )}
    </form>
  )
}

export { NewsletterForm }
