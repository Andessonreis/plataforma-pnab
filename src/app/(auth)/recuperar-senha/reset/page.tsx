import type { Metadata } from 'next'
import { ResetPasswordForm } from './reset-password-form'

export const metadata: Metadata = {
  title: 'Redefinir Senha',
}

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams
  const token = params.token ?? ''

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Redefinir senha</h1>
        <p className="mt-2 text-sm text-slate-600">
          Escolha uma nova senha para sua conta.
        </p>
      </div>

      <ResetPasswordForm token={token} />
    </div>
  )
}
