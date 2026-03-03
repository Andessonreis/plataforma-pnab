import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { NoticiaForm } from '../noticia-form'
import { DeleteNoticiaButton } from './delete-button'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const noticia = await prisma.noticia.findUnique({
    where: { id },
    select: { titulo: true },
  })
  return { title: `Editar: ${noticia?.titulo ?? id} — Portal PNAB Irece` }
}

export default async function EditarNoticiaPage({ params }: Props) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/')

  const { id } = await params
  const noticia = await prisma.noticia.findUnique({ where: { id } })

  if (!noticia) notFound()

  // Formatar publicadoEm para datetime-local input
  const publicadoEmFormatted = noticia.publicadoEm
    ? new Date(noticia.publicadoEm).toISOString().slice(0, 16)
    : ''

  return (
    <section>
      <div className="mb-6">
        <Link
          href="/admin/noticias"
          className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 mb-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para Noticias
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Editar Noticia</h1>
            <p className="text-slate-600 mt-1">{noticia.titulo}</p>
          </div>
          <DeleteNoticiaButton noticiaId={noticia.id} noticiaTitle={noticia.titulo} />
        </div>
      </div>

      <NoticiaForm
        initialData={{
          id: noticia.id,
          titulo: noticia.titulo,
          corpo: noticia.corpo,
          tags: noticia.tags,
          imagemUrl: noticia.imagemUrl ?? '',
          publicado: noticia.publicado,
          publicadoEm: publicadoEmFormatted,
        }}
        noticiaId={noticia.id}
      />
    </section>
  )
}
