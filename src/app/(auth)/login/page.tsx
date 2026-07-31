import type { Metadata } from 'next'
import { PaginaAcesso } from '../pagina-acesso'
import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: 'Entrar',
}

export default function LoginPage() {
  return (
    <PaginaAcesso titulo="Entrar" descricao="Acesse sua conta para gerenciar inscrições e projetos culturais.">
      <LoginForm />
    </PaginaAcesso>
  )
}
