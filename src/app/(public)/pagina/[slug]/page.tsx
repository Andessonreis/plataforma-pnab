import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = await prisma.cmsPage.findUnique({
    where: { slug },
    select: { titulo: true },
  })

  if (!page) return { title: 'Pagina nao encontrada — Portal PNAB Irece' }

  return {
    title: `${page.titulo} — Portal PNAB Irece`,
    openGraph: {
      title: `${page.titulo} — Portal PNAB Irece`,
    },
  }
}

export default async function PublicCmsPage({ params }: Props) {
  const { slug } = await params

  const page = await prisma.cmsPage.findUnique({
    where: { slug },
  })

  if (!page || !page.publicado) notFound()

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">{page.titulo}</h1>

      <div
        className="cms-content"
        dangerouslySetInnerHTML={{ __html: page.corpo }}
      />
    </main>
  )
}
