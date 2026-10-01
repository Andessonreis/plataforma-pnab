import type { Metadata } from 'next'
import { PaginaHabilitacao, metadataHabilitacao } from '../_habilitacao/pagina-habilitacao'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ preview?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return metadataHabilitacao({ slug })
}

export default async function HabilitacaoPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { preview } = await searchParams
  return <PaginaHabilitacao slug={slug} preview={preview === '1' || preview === 'true'} />
}
