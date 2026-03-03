import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { FaqForm } from '../faq-form'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const faqItem = await prisma.faqItem.findUnique({
    where: { id },
    select: { pergunta: true },
  })
  return { title: `Editar: ${faqItem?.pergunta?.slice(0, 50) ?? id} — Portal PNAB Irece` }
}

export default async function EditarFaqPage({ params }: Props) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/')

  const { id } = await params
  const faqItem = await prisma.faqItem.findUnique({
    where: { id },
    include: { edital: { select: { id: true, titulo: true } } },
  })

  if (!faqItem) notFound()

  const editais = await prisma.edital.findMany({
    select: { id: true, titulo: true },
    orderBy: { titulo: 'asc' },
  })

  return (
    <section>
      <div className="mb-6">
        <Link
          href="/admin/faq"
          className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 mb-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para FAQ
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Editar Item de FAQ</h1>
        <p className="text-slate-600 mt-1 line-clamp-1">{faqItem.pergunta}</p>
      </div>

      <FaqForm
        initialData={{
          pergunta: faqItem.pergunta,
          resposta: faqItem.resposta,
          editalId: faqItem.editalId,
          ordem: faqItem.ordem,
          publicado: faqItem.publicado,
        }}
        faqItemId={faqItem.id}
        editais={editais}
      />
    </section>
  )
}
