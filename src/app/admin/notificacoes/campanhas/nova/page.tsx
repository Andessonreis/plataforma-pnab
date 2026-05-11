import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { CampaignForm } from '../campaign-form'

export const metadata: Metadata = {
  title: 'Nova Campanha — Portal PNAB Irecê',
}

export default async function NovaCampanhaPage() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/')

  const editais = await prisma.edital.findMany({
    where: { status: { not: 'RASCUNHO' } },
    select: { id: true, titulo: true, slug: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <section>
      <div className="mx-auto max-w-3xl mb-4 sm:mb-6">
        <Link
          href="/admin/notificacoes/campanhas"
          className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 mb-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para Campanhas
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Nova Campanha</h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          A campanha é salva como <strong>rascunho</strong>. Você pode revisar e disparar depois.
        </p>
      </div>

      <CampaignForm editais={editais} />
    </section>
  )
}
