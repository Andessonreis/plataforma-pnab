import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { FaqForm } from '../faq-form'

export const metadata: Metadata = {
  title: 'Novo Item de FAQ — Portal PNAB Irece',
}

export default async function NovoFaqPage() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/')

  const editais = await prisma.edital.findMany({
    select: { id: true, titulo: true },
    orderBy: { titulo: 'asc' },
  })

  return (
    <section>
      <div className="mb-4 sm:mb-6">
        <Link
          href="/admin/faq"
          className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 mb-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para FAQ
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Novo Item de FAQ</h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">Preencha a pergunta e a resposta.</p>
      </div>

      <FaqForm editais={editais} />
    </section>
  )
}
