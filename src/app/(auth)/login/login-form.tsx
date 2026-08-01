'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Aviso, Button, CampoSenha, Input } from '@/components/ui'
import { IconUser, IconLock } from '@/components/ui/icons'
import { formatCpfCnpj } from '@/lib/utils/format'
import { LinkVoltar } from '../link-voltar'

/** Destino inicial de cada perfil depois de entrar. */
function destinoPorPerfil(role: string | undefined): string {
  if (role === 'AVALIADOR') return '/avaliador'
  if (role && ['ADMIN', 'ATENDIMENTO', 'HABILITADOR'].includes(role)) return '/admin'
  return '/proponente'
}

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const senhaRedefinida = searchParams.get('senha') === 'redefinida'
  const cadastroConcluido = searchParams.get('cadastro') === 'sucesso'
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
        const session = await getSession()
        router.push(destinoPorPerfil(session?.user?.role))
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
      {cadastroConcluido && (
        <Aviso tom="sucesso">Cadastro concluído. Entre com o CPF/CNPJ e a senha que você criou.</Aviso>
      )}

      {senhaRedefinida && <Aviso tom="sucesso">Senha redefinida com sucesso. Entre com a nova senha.</Aviso>}

      <Input
        label="CPF ou CNPJ"
        type="text"
        inputMode="numeric"
        placeholder="000.000.000-00"
        value={cpfCnpj}
        onChange={(e) => setCpfCnpj(formatCpfCnpj(e.target.value))}
        maxLength={18}
        required
        autoComplete="username"
        leftIcon={<IconUser className="h-5 w-5" />}
      />

      <CampoSenha
        label="Senha"
        placeholder="Sua senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="current-password"
        leftIcon={<IconLock className="h-5 w-5" />}
      />

      {error && <Aviso tom="erro">{error}</Aviso>}

      <Button type="submit" loading={loading} className="w-full" size="lg">
        Entrar
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-x-4 text-sm">
        <Link
          href="/cadastro"
          className="inline-flex min-h-[44px] items-center font-medium text-brand-700 hover:text-brand-800 hover:underline"
        >
          Criar conta
        </Link>
        <Link
          href="/recuperar-senha"
          className="inline-flex min-h-[44px] items-center text-slate-500 hover:text-slate-700 hover:underline"
        >
          Esqueci minha senha
        </Link>
      </div>

      <div className="flex justify-center border-t border-slate-200 pt-5">
        <LinkVoltar href="/">Voltar ao portal</LinkVoltar>
      </div>
    </form>
  )
}
