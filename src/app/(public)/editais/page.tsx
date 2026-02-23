import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Editais',
}

export default function EditaisPage() {
  // TODO: Buscar editais via prisma (server component)
  // const editais = await prisma.edital.findMany({ where: { status: { not: 'RASCUNHO' } } })
  return (
    <section>
      <h1>Editais</h1>
      {/* TODO: Filtros (abertos / encerrados / em andamento) + CardEdital list */}
    </section>
  )
}
