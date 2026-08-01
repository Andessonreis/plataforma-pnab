import type { Metadata } from 'next'
import { PaginaAcesso } from '../pagina-acesso'
import { ForgotPasswordForm } from './forgot-password-form'

export const metadata: Metadata = {
  title: 'Recuperar senha',
}

export default function ForgotPasswordPage() {
  return (
    <PaginaAcesso
      titulo="Recuperar senha"
      descricao="Informe seu CPF ou CNPJ e enviamos as instruções para o e-mail cadastrado."
    >
      <ForgotPasswordForm />
    </PaginaAcesso>
  )
}
