import { Pagination } from '@/components/ui'
import { montarUrl } from '@/app/admin/memorial/_componentes/parametros'
import { listarVisitas } from '@/lib/services/memorial-agendamento-gestao.service'
import type { ListarVisitasQuery } from '@/lib/schemas/memorial-agendamento'
import { CartaoVisita } from './cartao-visita'

/** Lista paginada em cartões, na ordem da agenda (data e horário). */
export async function VisaoLista({ filtros }: { filtros: ListarVisitasQuery }) {
  const { itens, total } = await listarVisitas(filtros)
  const { page, pageSize, de, ate, status, busca } = filtros

  if (itens.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">
        Nenhum pedido de visita com esses filtros.
      </p>
    )
  }

  return (
    <>
      <p className="mb-3 text-sm text-slate-600">
        {total} {total === 1 ? 'pedido' : 'pedidos'}
      </p>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {itens.map((v) => (
          <li key={v.id}>
            <CartaoVisita visita={v} />
          </li>
        ))}
      </ul>
      <Pagination
        currentPage={page}
        totalPages={Math.ceil(total / pageSize)}
        baseUrl={montarUrl('/admin/memorial/agendamentos', { de, ate, status, busca })}
        className="mt-6"
      />
    </>
  )
}
