import type { Metadata } from 'next'
import { PaginaAcesso } from '../../pagina-acesso'
import { ResetPasswordForm } from './reset-password-form'

export const metadata: Metadata = {
  title: 'Redefinir senha',
}

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams
  const token = params.token ?? ''

  return (
    <PaginaAcesso titulo="Redefinir senha" descricao="Escolha uma nova senha para sua conta.">
      <ResetPasswordForm token={token} />
    </PaginaAcesso>
  )
}
