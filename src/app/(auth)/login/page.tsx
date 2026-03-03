import type { Metadata } from 'next'
import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: 'Login',
}

export default function LoginPage() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Entrar</h1>
        <p className="mt-2 text-sm text-slate-600">
          Acesse sua conta para gerenciar inscrições e projetos.
        </p>
      </div>

      <LoginForm />
    </div>
  )
}
