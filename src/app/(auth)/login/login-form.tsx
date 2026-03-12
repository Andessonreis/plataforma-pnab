'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button, Input } from '@/components/ui'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const senhaRedefinida = searchParams.get('senha') === 'redefinida'
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
        const session = await getSession()
        const role = session?.user?.role
        let dest = '/proponente'
        if (role === 'AVALIADOR') dest = '/avaliador'
        else if (['ADMIN', 'ATENDIMENTO', 'HABILITADOR'].includes(role ?? '')) dest = '/admin'
        router.push(dest)
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
        type={showPassword ? 'text' : 'password'}
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
        rightIcon={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2"
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {showPassword ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            )}
          </button>
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
