import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  // TODO: buscar edital pelo slug e retornar título real
  return { title: `Edital ${slug}` }
}

export default async function EditalPage({ params }: Props) {
  const { slug } = await params

  // TODO: const edital = await prisma.edital.findUnique({ where: { slug }, include: { arquivos: true } })
  // if (!edital) notFound()
  void slug
  void notFound

  return (
    <article>
      <h1>Edital</h1>
      {/* TODO: Resumo, cronograma, downloads, CTA inscrição */}
    </article>
  )
}
