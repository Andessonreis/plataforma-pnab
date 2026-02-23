import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Projetos Apoiados',
}

export default function ProjetosApoiadosPage() {
  // TODO: Buscar ProjetoApoiado publicados com filtros (edital, ano, categoria, localidade)
  return (
    <section>
      <h1>Projetos Apoiados</h1>
      {/* TODO: Filtros + tabela de transparência com export CSV/PDF */}
    </section>
  )
}
