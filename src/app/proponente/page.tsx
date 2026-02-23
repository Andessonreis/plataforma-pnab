import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Minha Área',
}

export default function ProponenteDashboardPage() {
  return (
    <section>
      <h1>Minha Área</h1>
      {/* TODO: Cards — minhas inscrições ativas, editais abertos, pendências */}
    </section>
  )
}
