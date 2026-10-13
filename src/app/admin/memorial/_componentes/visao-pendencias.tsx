import Link from 'next/link'
import { IconCheck } from '@/components/ui'
import { DecisaoRapida } from '@/app/admin/memorial/agendamentos/_componentes/decisao-rapida'
import { linkDiscreto } from '@/app/admin/memorial/_ui'
import { VisitaLinha, type VisitaCartao } from '@/app/admin/memorial/_ui/agenda-visita'
import { chegouHa } from '@/app/admin/memorial/_ui/agenda-tempo'
import { VisaoTarefas, type Tarefa } from './visao-tarefas'

interface Props {
  pedidos: { itens: (VisitaCartao & { createdAt: Date })[]; total: number }
  tarefas: Tarefa[]
  hoje: string
}

/**
 * "Precisa de você": tudo que só anda quando alguém da equipe responde. Pedidos de visita
 * primeiro, do mais antigo; depois conteúdo parado em revisão e fotos sem autorização.
 */
export function VisaoPendencias({ pedidos, tarefas, hoje }: Props) {
  const nada = pedidos.total === 0 && tarefas.length === 0

  if (nada) {
    return (
      <section aria-labelledby="pendencias-titulo" className="flex items-center gap-3 rounded-xl border border-oliva-200 bg-oliva-50 px-4 py-4">
        <IconCheck className="h-7 w-7 shrink-0 text-oliva-700" />
        <div>
          <h2 id="pendencias-titulo" className="text-base font-bold text-oliva-900">
            Tudo respondido
          </h2>
          <p className="text-sm text-oliva-800">Nenhum pedido de visita nem conteúdo esperando a equipe.</p>
        </div>
      </section>
    )
  }

  return (
    <section aria-labelledby="pendencias-titulo" className="overflow-hidden rounded-xl border border-accent-400 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 bg-accent-300 px-4 py-3">
        <h2 id="pendencias-titulo" className="text-lg font-bold text-tinta-900">
          Precisa de você
        </h2>
        {pedidos.total > pedidos.itens.length && (
          <Link href="/admin/memorial/agendamentos?aba=responder" className={`${linkDiscreto} py-2`}>
            Ver os {pedidos.total} pedidos
          </Link>
        )}
      </div>

      {pedidos.total > 0 && (
        <>
          <h3 className="px-4 pt-4 text-sm font-semibold text-tinta-700">
            {pedidos.total === 1 ? '1 pedido de visita sem resposta' : `${pedidos.total} pedidos de visita sem resposta`}
          </h3>
          <ul className="divide-y divide-tinta-900/10">
            {pedidos.itens.map((v) => (
              <VisitaLinha
                key={v.id}
                visita={v}
                hoje={hoje}
                nota={chegouHa(v.createdAt)}
                acoes={<DecisaoRapida id={v.id} rotulo={v.instituicao} />}
              />
            ))}
          </ul>
        </>
      )}

      {tarefas.length > 0 && <VisaoTarefas tarefas={tarefas} />}
    </section>
  )
}
