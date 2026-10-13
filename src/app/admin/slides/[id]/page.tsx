import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { ROLES_SLIDES } from '@/lib/services/slide-destaque.service'
import { buscarEditaisAbertura } from '@/app/(public)/_home/editais'
import { FOTOS_ABERTURA } from '@/app/(public)/_home/slide-institucional'
import { SlideForm } from '../slide-form'
import { formDoRegistro } from '../_form/estado'
import { DeleteSlideButton } from './delete-button'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const slide = await prisma.slideDestaque.findUnique({
    where: { id },
    select: { titulo: true },
  })
  return { title: `Editar: ${slide?.titulo ?? id} — Portal PNAB Irecê` }
}

export default async function EditarSlidePage({ params }: Props) {
  const session = await auth()
  if (!session || !ROLES_SLIDES.includes(session.user.role)) redirect('/')

  const { id } = await params
  const [slide, editais] = await Promise.all([
    prisma.slideDestaque.findUnique({ where: { id } }),
    buscarEditaisAbertura(),
  ])

  if (!slide) notFound()

  return (
    <section>
      <div className="mb-4 sm:mb-6">
        <Link
          href="/admin/slides"
          className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 mb-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para Slides
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Editar Slide</h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 line-clamp-1">{slide.titulo}</p>
          </div>
          <DeleteSlideButton slideId={slide.id} slideTitle={slide.titulo} />
        </div>
      </div>

      <SlideForm initialData={formDoRegistro(slide)} slideId={slide.id} editais={editais} fotos={FOTOS_ABERTURA} />
    </section>
  )
}
