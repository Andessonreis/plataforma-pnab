import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gestão de Editais',
}

export default function AdminEditaisPage() {
  return (
    <section>
      <h1>Gestão de Editais</h1>
      {/* TODO: Listagem, botão criar novo edital, troca de status (publicar, abrir inscrições...) */}
    </section>
  )
}
