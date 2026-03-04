import type { Metadata } from 'next'
import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: 'Login',
}

export default function LoginPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Entrar
        </h1>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          Acesse sua conta para gerenciar inscrições e projetos culturais.
        </p>
      </div>

      <LoginForm />
    </div>
  )
}
