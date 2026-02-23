import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contato e Atendimento',
}

export default function ContatoPage() {
  return (
    <section>
      <h1>Contato e Atendimento</h1>
      {/* TODO: Formulário de ticket (selecionar edital, assunto, mensagem) → gera protocolo */}
    </section>
  )
}
