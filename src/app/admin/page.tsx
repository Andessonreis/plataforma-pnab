import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Backoffice — Dashboard',
}

export default function AdminDashboardPage() {
  return (
    <section>
      <h1>Painel da Secretaria</h1>
      {/* TODO: KPIs — total inscrições, editais ativos, tickets abertos, % habilitadas */}
    </section>
  )
}
