import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { MomentoForm } from '../momento-form'
import { DeleteMomentoButton } from './delete-button'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const momento = await prisma.momentoSecretaria.findUnique({
    where: { id },
    select: { categoria: true },
  })
  return { title: `Editar: ${momento?.categoria ?? id} — Portal PNAB Irecê` }
}

export default async function EditarMomentoPage({ params }: Props) {
  const session = await auth()
  if (!session || !['SUPER_ADMIN', 'COMUNICACAO'].includes(session.user.role)) redirect('/')

  const { id } = await params
  const momento = await prisma.momentoSecretaria.findUnique({ where: { id } })

  if (!momento) notFound()

  return (
    <section>
      <div className="mb-4 sm:mb-6">
        <Link
          href="/admin/momentos"
          className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 mb-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para Dia a Dia
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Editar Momento</h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 line-clamp-1">{momento.categoria}</p>
          </div>
          <DeleteMomentoButton momentoId={momento.id} momentoCategoria={momento.categoria} />
        </div>
      </div>

      <MomentoForm
        initialData={{
          id: momento.id,
          categoria: momento.categoria,
          imagemUrl: momento.imagemUrl,
          instagramUrl: momento.instagramUrl,
          ordem: momento.ordem,
          ativo: momento.ativo,
        }}
        momentoId={momento.id}
      />
    </section>
  )
}
