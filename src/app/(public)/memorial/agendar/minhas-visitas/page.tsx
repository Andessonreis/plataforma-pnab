import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Pagination } from '@/components/ui'
import { FolhaDeRosto } from '@/components/ui/folha-de-rosto'
import { listarMinhasVisitas } from '@/lib/services/memorial-agendamento.service'
import { dateParaDia, formatarDiaPorExtenso } from '@/lib/memorial/agendamento/datas'
import { ROTULO_STATUS } from '@/lib/memorial/agendamento/status'

export const metadata: Metadata = { title: 'Minhas visitas ao Memorial — Portal PNAB Irecê' }

const FOTOS = ['/images/cidade/panoramica-irece.jpg', '/images/secult/festa-irece.jpg']
const POR_PAGINA = 10

// Situações que pedem atenção do responsável ganham cor; as demais ficam neutras.
const TOM: Partial<Record<string, string>> = {
  CONFIRMADO: 'bg-oliva-100 text-oliva-900',
  RECUSADO: 'bg-red-50 text-red-800',
  CANCELADO: 'bg-red-50 text-red-800',
}

interface Props {
  searchParams: Promise<{ page?: string }>
}

export default async function MinhasVisitasPage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const page = Math.max(1, Number((await searchParams).page) || 1)
  const { itens, total } = await listarMinhasVisitas(session.user.id, page, POR_PAGINA)

  return (
    <div className="tema-secult font-questrial">
      <FolhaDeRosto compacto fotos={FOTOS} trilha="Minhas visitas" chamada="Memorial de Irecê" titulo="Minhas visitas" />

      <section aria-label="Visitas pedidas" className="papel-textura bg-papel-50 py-10 sm:py-14">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          {itens.length === 0 ? (
            <div className="border-2 border-tinta-900 bg-white p-6 sm:p-8">
              <p className="text-base text-tinta-800">Você ainda não pediu nenhuma visita com esta conta.</p>
              <Link href="/memorial/agendar" className="mt-4 inline-flex min-h-[48px] items-center bg-tinta-900 px-6 text-sm font-semibold text-papel-50 hover:bg-tinta-800">
                Agendar uma visita
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {itens.map((v) => (
                <li key={v.id} className="border-2 border-tinta-900/15 bg-white p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-base font-semibold text-tinta-900">{formatarDiaPorExtenso(dateParaDia(v.data))}</p>
                    <span className={`px-2.5 py-1 text-xs font-semibold ${TOM[v.status] ?? 'bg-papel-100 text-tinta-800'}`}>
                      {ROTULO_STATUS[v.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-tinta-700">
                    Das {v.horaInicio} às {v.horaFim}, {v.instituicao}, {v.quantidade} pessoas
                  </p>
                  <p className="mt-2 font-mono text-sm text-tinta-600">{v.protocolo}</p>
                  {v.motivoRecusa && <p className="mt-2 text-sm text-red-800">Motivo: {v.motivoRecusa}</p>}
                </li>
              ))}
            </ul>
          )}
          <Pagination
            currentPage={page}
            totalPages={Math.ceil(total / POR_PAGINA)}
            baseUrl="/memorial/agendar/minhas-visitas"
            className="mt-6"
          />
        </div>
      </section>
    </div>
  )
}
