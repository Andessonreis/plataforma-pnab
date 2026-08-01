'use client'

import { useState } from 'react'
import { Aviso, Button, Input } from '@/components/ui'
import { formatCpfCnpj } from '@/lib/utils/format'
import { LinkVoltar } from '../link-voltar'

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
      <div className="space-y-5">
        <Aviso tom="sucesso">
          Se o CPF/CNPJ estiver cadastrado, você receberá um e-mail com instruções para redefinir sua
          senha.
        </Aviso>

        <p className="text-sm text-slate-500">
          O link vale por uma hora. Se não chegar em alguns minutos, confira a pasta de spam.
        </p>

        <LinkVoltar href="/login">Voltar para o login</LinkVoltar>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <Input
        label="CPF ou CNPJ"
        type="text"
        inputMode="numeric"
        placeholder="000.000.000-00"
        value={cpfCnpj}
        onChange={(e) => setCpfCnpj(formatCpfCnpj(e.target.value))}
        maxLength={18}
        required
        autoFocus
        autoComplete="username"
        hint="Enviamos as instruções para o e-mail cadastrado nesta conta."
      />

      {error && <Aviso tom="erro">{error}</Aviso>}

      <Button type="submit" loading={loading} className="w-full" size="lg">
        Enviar instruções
      </Button>

      <div className="border-t border-slate-200 pt-5">
        <LinkVoltar href="/login">Voltar para o login</LinkVoltar>
      </div>
    </form>
  )
}
