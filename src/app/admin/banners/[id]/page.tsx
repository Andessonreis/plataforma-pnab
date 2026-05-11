import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { BannerForm } from '../banner-form'
import { DeleteBannerButton } from './delete-button'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const banner = await prisma.banner.findUnique({
    where: { id },
    select: { titulo: true },
  })
  return { title: `Editar: ${banner?.titulo ?? id} — Portal PNAB Irecê` }
}

export default async function EditarBannerPage({ params }: Props) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/')

  const { id } = await params
  const banner = await prisma.banner.findUnique({ where: { id } })

  if (!banner) notFound()

  const inicioEmFormatted = new Date(banner.inicioEm).toISOString().slice(0, 16)
  const fimEmFormatted = new Date(banner.fimEm).toISOString().slice(0, 16)

  return (
    <section>
      <div className="mb-4 sm:mb-6">
        <Link
          href="/admin/banners"
          className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 mb-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para Banners
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Editar Banner</h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 line-clamp-1">{banner.titulo}</p>
          </div>
          <DeleteBannerButton bannerId={banner.id} bannerTitle={banner.titulo} />
        </div>
      </div>

      <BannerForm
        initialData={{
          id: banner.id,
          titulo: banner.titulo,
          texto: banner.texto,
          ctaLabel: banner.ctaLabel ?? '',
          ctaUrl: banner.ctaUrl ?? '',
          ativo: banner.ativo,
          inicioEm: inicioEmFormatted,
          fimEm: fimEmFormatted,
        }}
        bannerId={banner.id}
      />
    </section>
  )
}
