import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { EditalForm } from '../edital-form'

export const metadata: Metadata = {
  title: 'Novo Edital — Portal PNAB Irece',
}

export default async function NovoEditalPage() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/')

  return (
    <section>
      <div className="mb-6">
        <Link
          href="/admin/editais"
          className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 mb-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para Editais
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Novo Edital</h1>
        <p className="text-slate-600 mt-1">Preencha os dados do novo edital.</p>
      </div>

      <EditalForm />
    </section>
  )
}
