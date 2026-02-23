import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login',
}

export default function LoginPage() {
  return (
    <div>
      <h1>Entrar</h1>
      {/* TODO: Formulário CPF/CNPJ + senha, link para cadastro, link para recuperar senha */}
      {/* Usar signIn() do @/lib/auth com Server Action */}
    </div>
  )
}
