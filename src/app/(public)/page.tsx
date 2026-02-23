import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Início',
}

export default function HomePage() {
  return (
    <section>
      <h1>Portal PNAB Irecê</h1>
      <p>Política Nacional Aldir Blanc de Fomento à Cultura — Secretaria de Arte e Cultura de Irecê/BA</p>
      {/* TODO: Banner de editais abertos, seção de destaques, links rápidos */}
    </section>
  )
}
