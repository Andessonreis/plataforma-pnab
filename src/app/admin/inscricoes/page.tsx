import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Inscrições',
}

export default function AdminInscricoesPage() {
  return (
    <section>
      <h1>Inscrições</h1>
      {/* TODO: Filtros por edital/status, tabela, ações de habilitação, export CSV */}
    </section>
  )
}
