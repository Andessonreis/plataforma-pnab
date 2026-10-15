import type { Metadata } from 'next'
import { PaginaSuplentes, metadataSuplentes } from '../_suplentes/pagina-suplentes'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ preview?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return metadataSuplentes({ slug })
}

export default async function SuplentesPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { preview } = await searchParams
  return <PaginaSuplentes slug={slug} preview={preview === '1' || preview === 'true'} />
}
