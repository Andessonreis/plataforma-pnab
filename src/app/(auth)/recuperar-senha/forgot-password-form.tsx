'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button, Input } from '@/components/ui'

export function ForgotPasswordForm() {
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    const docLimpo = cpfCnpj.replace(/\D/g, '')

    if (!docLimpo) {
      setError('Informe seu CPF ou CNPJ.')
      return
    }

    if (docLimpo.length !== 11 && docLimpo.length !== 14) {
      setError('CPF deve ter 11 dígitos e CNPJ deve ter 14 dígitos.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpfCnpj: docLimpo }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.message || 'Erro ao processar solicitação.')
        return
      }

      setSuccess(true)
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg bg-brand-50 border border-brand-200 px-4 py-3 text-sm text-brand-700" role="status">
          Se o CPF/CNPJ estiver cadastrado, você receberá um e-mail com instruções para redefinir sua senha.
        </div>

        <p className="text-center text-sm text-slate-600">
          Verifique sua caixa de entrada e a pasta de spam.
        </p>

        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 min-h-[44px]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Voltar para o login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <Input
        label="CPF ou CNPJ"
        type="text"
        placeholder="000.000.000-00"
        value={cpfCnpj}
        onChange={(e) => setCpfCnpj(e.target.value)}
        required
        autoComplete="username"
        leftIcon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
        }
      />

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full" size="lg">
        Enviar instruções
      </Button>

      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 min-h-[44px]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Voltar para o login
        </Link>
      </div>
    </form>
  )
}
