import type { Metadata } from 'next'
import { PaginaRecursos, metadataRecursos } from '../_resultados/pagina-recursos'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return metadataRecursos((await params).slug)
}

export default async function ResultadosRecursoAvaliacao({ params }: Props) {
  return <PaginaRecursos slug={(await params).slug} />
}
