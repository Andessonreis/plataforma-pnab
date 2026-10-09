import Link from 'next/link'
import { Pagination } from '@/components/ui'
import { listarMinhasVisitas } from '@/lib/services/memorial-agendamento.service'
import { dateParaDia, formatarDiaPorExtenso } from '@/lib/memorial/agendamento/datas'
import { ROTULO_STATUS } from '@/lib/memorial/agendamento/status'
import { getConfig } from '@/lib/memorial/config'
import { AjudaVisita } from '@/app/(public)/memorial/agendar/ajuda-visita'

const POR_PAGINA = 10

// Situações que pedem atenção do responsável ganham cor; as demais ficam neutras.
const TOM: Partial<Record<string, string>> = {
  CONFIRMADO: 'bg-oliva-100 text-oliva-900',
  RECUSADO: 'bg-red-50 text-red-800',
  CANCELADO: 'bg-red-50 text-red-800',
}

interface ListaVisitasProps {
  userId: string
  page: number
  /** Rota da própria lista, usada pela paginação. */
  baseUrl: string
  /** Rota do pedido de visita, oferecida quando a conta ainda não tem nenhuma. */
  agendarHref: string
}

/**
 * Visitas pedidas pela conta, da mais recente à mais antiga. Compartilhada
 * pela página pública e pela do painel do proponente: só a moldura muda.
 */
export async function ListaVisitas({ userId, page, baseUrl, agendarHref }: ListaVisitasProps) {
  const [{ itens, total }, contato] = await Promise.all([listarMinhasVisitas(userId, page, POR_PAGINA), getConfig('contato')])

  return (
    <>
      {itens.length === 0 ? (
        <div className="border-2 border-tinta-900 bg-white p-6 sm:p-8">
          <p className="text-base text-tinta-800">Você ainda não pediu nenhuma visita com esta conta.</p>
          <Link href={agendarHref} className="mt-4 inline-flex min-h-[48px] items-center bg-tinta-900 px-6 text-sm font-semibold text-papel-50 hover:bg-tinta-800">
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
              <AjudaVisita contatoEmail={contato.email} protocolo={v.protocolo} className="mt-2" />
            </li>
          ))}
        </ul>
      )}
      <Pagination currentPage={page} totalPages={Math.ceil(total / POR_PAGINA)} baseUrl={baseUrl} className="mt-6" />
    </>
  )
}
