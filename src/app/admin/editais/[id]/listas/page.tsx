import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import { inscricaoStatusLabel, inscricaoStatusVariant } from '@/lib/status-maps'
import { DownloadButton } from './download-button'
import type { InscricaoStatus } from '@prisma/client'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const edital = await prisma.edital.findUnique({
    where: { id },
    select: { titulo: true },
  })
  return { title: `Listas: ${edital?.titulo ?? id} — Portal PNAB Irecê` }
}

/** Ordem de exibição dos status (RASCUNHO é omitido). */
const STATUS_ORDER: InscricaoStatus[] = [
  'ENVIADA',
  'HABILITADA',
  'INABILITADA',
  'EM_AVALIACAO',
  'RESULTADO_PRELIMINAR',
  'RECURSO_ABERTO',
  'RESULTADO_FINAL',
  'CONTEMPLADA',
  'NAO_CONTEMPLADA',
  'SUPLENTE',
]

export default async function ListasEditalPage({ params }: Props) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/')

  const { id } = await params
  const edital = await prisma.edital.findUnique({
    where: { id },
    select: { id: true, titulo: true, ano: true },
  })

  if (!edital) notFound()

  // Contar inscrições por status
  const counts = await prisma.inscricao.groupBy({
    by: ['status'],
    where: { editalId: id },
    _count: true,
  })

  const countMap = new Map(counts.map((c) => [c.status, c._count]))

  // Filtrar: somente status com count > 0 e que não seja RASCUNHO
  const statusCards = STATUS_ORDER.filter((s) => (countMap.get(s) ?? 0) > 0)

  return (
    <section>
      {/* Breadcrumb */}
      <nav className="mb-4 text-sm text-slate-500" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/admin" className="hover:text-brand-600">Painel</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/admin/editais" className="hover:text-brand-600">Editais</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={`/admin/editais/${edital.id}`} className="hover:text-brand-600">
              {edital.titulo}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-slate-900 font-medium">Listas</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/admin/editais/${edital.id}`}
          className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 mb-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Voltar ao Edital
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">
          Listas &mdash; {edital.titulo} ({edital.ano})
        </h1>
        <p className="text-slate-600 mt-1">
          Gere listas oficiais em PDF ou CSV por status de inscrição.
        </p>
      </div>

      {/* Grid de cards */}
      {statusCards.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500">
          Nenhuma inscrição encontrada para este edital.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {statusCards.map((status) => {
            const count = countMap.get(status) ?? 0
            const label = inscricaoStatusLabel[status]
            const variant = inscricaoStatusVariant[status]

            return (
              <div
                key={status}
                className="rounded-lg border border-slate-200 bg-white p-5 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <Badge variant={variant} dot>
                    {label}
                  </Badge>
                  <span className="text-2xl font-bold text-slate-900">{count}</span>
                </div>

                <p className="text-sm text-slate-500">
                  {count === 1 ? '1 inscrição' : `${count} inscrições`}
                </p>

                <div className="flex items-center gap-2 mt-auto pt-2 border-t border-slate-100">
                  <DownloadButton
                    editalId={edital.id}
                    status={status}
                    format="pdf"
                    label={label}
                    count={count}
                  />
                  <DownloadButton
                    editalId={edital.id}
                    status={status}
                    format="csv"
                    label={label}
                    count={count}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
