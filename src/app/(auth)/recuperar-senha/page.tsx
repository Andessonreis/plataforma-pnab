import type { Metadata } from 'next'
import { ForgotPasswordForm } from './forgot-password-form'

export const metadata: Metadata = {
  title: 'Recuperar Senha',
}

export default function ForgotPasswordPage() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Recuperar senha</h1>
        <p className="mt-2 text-sm text-slate-600">
          Informe seu CPF/CNPJ para receber as instruções de recuperação por e-mail.
        </p>
      </div>

      <ForgotPasswordForm />
    </div>
  )
}
