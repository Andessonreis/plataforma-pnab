import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Minhas Inscrições',
}

export default function MinhasInscricoesPage() {
  // TODO: Listar inscrições do proponente autenticado com status e stepper visual
  return (
    <section>
      <h1>Minhas Inscrições</h1>
      {/* TODO: Tabela com número, edital, status, data, link para detalhes */}
    </section>
  )
}
