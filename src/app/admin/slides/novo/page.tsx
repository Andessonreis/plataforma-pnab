import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ROLES_SLIDES } from '@/lib/services/slide-destaque.service'
import { buscarEditaisAbertura } from '@/app/(public)/_home/editais'
import { FOTOS_ABERTURA } from '@/app/(public)/_home/slide-institucional'
import { SlideForm } from '../slide-form'

export const metadata: Metadata = {
  title: 'Novo Slide — Portal PNAB Irecê',
}

export default async function NovoSlidePage() {
  const session = await auth()
  if (!session || !ROLES_SLIDES.includes(session.user.role)) redirect('/')
  const editais = await buscarEditaisAbertura()

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
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Novo Slide</h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">Escolha o tipo, preencha e confira na prévia como fica na página inicial.</p>
      </div>

      <SlideForm editais={editais} fotos={FOTOS_ABERTURA} />
    </section>
  )
}
