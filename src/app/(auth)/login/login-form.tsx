'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button, Input } from '@/components/ui'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const senhaRedefinida = searchParams.get('senha') === 'redefinida'
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        cpfCnpj: cpfCnpj.replace(/\D/g, ''),
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('CPF/CNPJ ou senha incorretos.')
      } else {
        router.push('/proponente')
        router.refresh()
      }
    } catch {
      setError('Erro ao tentar entrar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {senhaRedefinida && (
        <div className="rounded-lg bg-brand-50 border border-brand-200 px-4 py-3 text-sm text-brand-700" role="status">
          Senha redefinida com sucesso! Faça login com sua nova senha.
        </div>
      )}

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

      <Input
        label="Senha"
        type="password"
        placeholder="Sua senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="current-password"
        leftIcon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
        }
      />

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full" size="lg">
        Entrar
      </Button>

      <div className="flex items-center justify-between text-sm">
        <Link
          href="/cadastro"
          className="text-brand-600 hover:text-brand-700 font-medium"
        >
          Criar conta
        </Link>
        <Link
          href="/recuperar-senha"
          className="text-slate-500 hover:text-slate-700"
        >
          Esqueci minha senha
        </Link>
      </div>
    </form>
  )
}
