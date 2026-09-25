import type { Metadata } from 'next'
import { PaginaResultados, metadataResultados } from '../_resultados/pagina-resultados'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return metadataResultados({ slug: (await params).slug, fase: 'definitivo' })
}

export default async function ResultadosDefinitivo({ params }: Props) {
  return <PaginaResultados slug={(await params).slug} fase="definitivo" />
}
