import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { CmsForm } from '../cms-form'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const page = await prisma.cmsPage.findUnique({
    where: { id },
    select: { titulo: true },
  })
  return { title: `Editar: ${page?.titulo ?? id} — Portal PNAB Irece` }
}

export default async function EditarCmsPage({ params }: Props) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/')

  const { id } = await params
  const page = await prisma.cmsPage.findUnique({ where: { id } })

  if (!page) notFound()

  return (
    <section>
      <div className="mb-6">
        <Link
          href="/admin/cms"
          className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 mb-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para Paginas
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Editar Pagina</h1>
        <p className="text-slate-600 mt-1">{page.titulo}</p>
      </div>

      <CmsForm
        initialData={{
          id: page.id,
          titulo: page.titulo,
          corpo: page.corpo,
          publicado: page.publicado,
        }}
      />
    </section>
  )
}
