import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Notícias',
}

export default function NoticiasPage() {
  return (
    <section>
      <h1>Cultura em Movimento</h1>
      {/* TODO: Grid de cards de notícias, paginação */}
    </section>
  )
}
