import { BlocoSecao } from '@/app/admin/memorial/_ui'
import type { RelatorioVisitas } from '@/lib/memorial/agendamento/relatorio'
import { agruparSituacao, numero, ROTULO_SITUACAO, type GrupoSituacao } from './calculos'

const COR: Record<GrupoSituacao, string> = {
  realizadas: 'bg-oliva-700',
  confirmadas: 'bg-turquesa-500',
  aguardando: 'bg-accent-400',
  faltaram: 'bg-ameixa-600',
  canceladas: 'bg-ameixa-300',
  recusadas: 'bg-tinta-300',
}

/** Desfecho de todos os pedidos do período: uma barra inteira repartida e a legenda com os números. */
export function SituacaoPedidos({ porStatus, pedidos }: Pick<RelatorioVisitas, 'porStatus' | 'pedidos'>) {
  const grupos = agruparSituacao(porStatus).filter((g) => g.quantidade > 0)

  return (
    <BlocoSecao titulo="O que aconteceu com os pedidos" dica={`${numero(pedidos)} pedidos recebidos no período`}>
      <div role="img" aria-label="Divisão dos pedidos por situação, números na lista abaixo" className="flex h-5 gap-0.5 overflow-hidden rounded-full">
        {grupos.map((g) => (
          <span key={g.grupo} className={COR[g.grupo]} style={{ flexGrow: g.quantidade, flexBasis: 0 }} />
        ))}
      </div>
      <ul className="mt-4 divide-y divide-tinta-900/10">
        {grupos.map((g) => (
          <li key={g.grupo} className="flex min-h-[44px] items-center gap-3 text-sm">
            <span aria-hidden="true" className={`h-3 w-3 shrink-0 rounded-sm ${COR[g.grupo]}`} />
            <span className="min-w-0 flex-1 font-semibold text-tinta-900">{ROTULO_SITUACAO[g.grupo]}</span>
            <span className="tabular-nums text-tinta-700">{Math.round((g.quantidade / pedidos) * 100)}%</span>
            <span className="w-10 text-right text-base font-bold tabular-nums text-tinta-900">{numero(g.quantidade)}</span>
          </li>
        ))}
      </ul>
    </BlocoSecao>
  )
}
