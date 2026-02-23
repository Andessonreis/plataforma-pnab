import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cadastro',
}

export default function CadastroPage() {
  return (
    <div>
      <h1>Criar conta</h1>
      {/* TODO: Formulário PF / MEI / PJ / Coletivo com validação Zod */}
      {/* Campos: tipo_proponente, cpf/cnpj, nome, email, telefone, senha */}
    </div>
  )
}
