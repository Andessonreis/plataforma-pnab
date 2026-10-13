import { IconCalendar, Pagination } from '@/components/ui'
import { montarUrl } from '@/app/admin/memorial/_componentes/parametros'
import { VazioAcionavel } from '@/app/admin/memorial/_ui'
import { GRADE_VISITA, VisitaLinha } from '@/app/admin/memorial/_ui/agenda-visita'
import { chegouHa } from '@/app/admin/memorial/_ui/agenda-tempo'
import { diaEmIrece } from '@/lib/memorial/agendamento/datas'
import { listarAba, type AbaAgenda } from '@/lib/services/memorial-agenda-abas.service'
import type { ListarVisitasQuery } from '@/lib/schemas/memorial-agendamento'
import { DecisaoRapida } from './decisao-rapida'

const VAZIO: Record<AbaAgenda, { titulo: string; texto: string; acao?: { href: string; rotulo: string } }> = {
  responder: {
    titulo: 'Tudo respondido',
    texto: 'Nenhum pedido esperando resposta. Os novos chegam aqui e por e-mail para a equipe.',
    acao: { href: '/admin/memorial/agendamentos?aba=confirmadas', rotulo: 'Ver as confirmadas' },
  },
  confirmadas: { titulo: 'Nenhuma visita confirmada pela frente', texto: 'Quando um pedido for confirmado, ele aparece aqui até o dia da visita.' },
  realizadas: { titulo: 'Nenhuma visita realizada ainda', texto: 'Depois do dia da visita, marque no pedido se o grupo veio.' },
  todas: { titulo: 'Nenhum pedido encontrado', texto: 'Tente buscar só parte do nome da instituição ou limpar os filtros.' },
}

const COLUNAS = ['Data', 'Instituição', 'Horário', 'Grupo', 'Responsável', 'Situação']

/** Lista da aba: cartões no celular, linhas com cabeçalho no desktop. */
export async function VisaoLista({ aba, filtros }: { aba: AbaAgenda; filtros: ListarVisitasQuery }) {
  const { itens, total } = await listarAba(aba, filtros)
  const { page, pageSize, de, ate, status, busca } = filtros
  const hoje = diaEmIrece(new Date())

  if (itens.length === 0) {
    const v = VAZIO[aba]
    return <VazioAcionavel icone={<IconCalendar className="h-6 w-6" />} titulo={v.titulo} texto={v.texto} acao={v.acao} />
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-tinta-900/15 bg-white">
        <div className={`hidden border-b border-tinta-900/10 bg-papel-50 px-4 py-2 text-xs font-bold text-tinta-700 ${GRADE_VISITA}`} aria-hidden="true">
          {COLUNAS.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
        <ul className="divide-y divide-tinta-900/10">
          {itens.map((v) => (
            <VisitaLinha
              key={v.id}
              visita={v}
              hoje={hoje}
              nota={aba === 'responder' ? chegouHa(v.createdAt) : undefined}
              acoes={aba === 'responder' ? <DecisaoRapida id={v.id} rotulo={v.instituicao} /> : undefined}
            />
          ))}
        </ul>
      </div>
      <p className="mt-3 text-sm text-tinta-600">
        {total} {total === 1 ? 'pedido' : 'pedidos'}
      </p>
      <Pagination
        currentPage={page}
        totalPages={Math.ceil(total / pageSize)}
        baseUrl={montarUrl('/admin/memorial/agendamentos', { aba, de, ate, status, busca })}
        className="mt-4"
      />
    </>
  )
}
