'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Aviso, Button, CampoSenha } from '@/components/ui'
import { LinkVoltar } from '../../link-voltar'

interface ResetPasswordFormProps {
  token: string
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Erro ao redefinir senha.')
        return
      }

      router.push('/login?senha=redefinida')
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="space-y-5">
        <Aviso tom="erro">Link inválido ou expirado. Solicite uma nova recuperação de senha.</Aviso>
        <LinkVoltar href="/recuperar-senha">Solicitar nova recuperação</LinkVoltar>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <CampoSenha
        label="Nova senha"
        placeholder="Mínimo 8 caracteres"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoFocus
        autoComplete="new-password"
        hint="Mínimo de 8 caracteres."
      />

      <CampoSenha
        label="Confirmar nova senha"
        placeholder="Repita a nova senha"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        autoComplete="new-password"
      />

      {error && <Aviso tom="erro">{error}</Aviso>}

      <Button type="submit" loading={loading} className="w-full" size="lg">
        Redefinir senha
      </Button>

      <div className="border-t border-slate-200 pt-5">
        <LinkVoltar href="/login">Voltar para o login</LinkVoltar>
      </div>
    </form>
  )
}
