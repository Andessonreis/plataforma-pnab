import Link from 'next/link'
import { Badge, EmptyState, IconStar } from '@/components/ui'

export interface AvaliacaoRecente {
  id: string
  inscricaoId: string
  finalizada: boolean
  notaTotal: unknown
  inscricao: {
    numero: string
    categoria: string | null
    proponente: { nome: string }
    edital: { titulo: string; ano: number }
  }
}

function ListaVazia() {
  return (
    <EmptyState
      icon={<IconStar className="h-8 w-8 text-tinta-400" />}
      title="Nenhuma avaliação atribuída"
      description="Você receberá notificação quando novas inscrições forem designadas para avaliação."
    />
  )
}

function ListaMobile({ avaliacoes }: { avaliacoes: AvaliacaoRecente[] }) {
  return (
    <div className="sm:hidden divide-y divide-papel-200 -mx-4">
      {avaliacoes.map((av) => {
        const isPending = !av.finalizada
        return (
          <Link
            key={av.id}
            href={`/admin/inscricoes/${av.inscricaoId}`}
            className="flex items-start gap-3 px-4 py-3.5 hover:bg-ameixa-50/60 transition-colors"
          >
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isPending ? 'bg-ameixa-50' : 'bg-emerald-50'}`}>
              <IconStar className={`h-4 w-4 ${isPending ? 'text-ameixa-600' : 'text-emerald-600'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-tinta-950 truncate">{av.inscricao.proponente.nome}</p>
              <p className="text-xs text-tinta-700/50 truncate">{av.inscricao.edital.titulo}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-mono text-tinta-700/40">{av.inscricao.numero}</span>
                <Badge variant={isPending ? 'warning' : 'success'}>
                  {isPending ? 'Pendente' : `Nota: ${av.notaTotal}`}
                </Badge>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

function TabelaDesktop({ avaliacoes }: { avaliacoes: AvaliacaoRecente[] }) {
  return (
    <div className="hidden sm:block overflow-x-auto -mx-4 sm:-mx-6">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-papel-200">
            <th className="text-left py-2.5 px-4 sm:px-6 font-medium text-tinta-700/50 text-xs uppercase tracking-wide">Nº Inscrição</th>
            <th className="text-left py-2.5 px-4 font-medium text-tinta-700/50 text-xs uppercase tracking-wide">Proponente</th>
            <th className="text-left py-2.5 px-4 font-medium text-tinta-700/50 text-xs uppercase tracking-wide">Edital</th>
            <th className="text-left py-2.5 px-4 font-medium text-tinta-700/50 text-xs uppercase tracking-wide">Categoria</th>
            <th className="text-left py-2.5 px-4 font-medium text-tinta-700/50 text-xs uppercase tracking-wide">Status</th>
            <th className="py-2.5 px-4 sm:px-6" />
          </tr>
        </thead>
        <tbody className="divide-y divide-papel-200">
          {avaliacoes.map((av) => {
            const isPending = !av.finalizada
            return (
              <tr key={av.id} className="hover:bg-ameixa-50/40 transition-colors">
                <td className="py-3 px-4 sm:px-6 font-mono text-xs text-tinta-700/70">{av.inscricao.numero}</td>
                <td className="py-3 px-4">
                  <p className="font-medium text-tinta-950">{av.inscricao.proponente.nome}</p>
                </td>
                <td className="py-3 px-4 text-tinta-700 max-w-[200px]">
                  <p className="truncate">{av.inscricao.edital.titulo}</p>
                  <p className="text-xs text-tinta-700/50">{av.inscricao.edital.ano}</p>
                </td>
                <td className="py-3 px-4 text-tinta-700">{av.inscricao.categoria ?? '—'}</td>
                <td className="py-3 px-4">
                  <Badge variant={isPending ? 'warning' : 'success'}>
                    {isPending ? 'Pendente' : `Nota: ${av.notaTotal}`}
                  </Badge>
                </td>
                <td className="py-3 px-4 sm:px-6 text-right">
                  <Link href={`/admin/inscricoes/${av.inscricaoId}`} className="text-ameixa-700 hover:text-ameixa-800 font-medium text-xs">
                    {isPending ? 'Avaliar' : 'Ver'}
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function ListaAvaliacoes({ avaliacoes }: { avaliacoes: AvaliacaoRecente[] }) {
  if (avaliacoes.length === 0) return <ListaVazia />
  return (
    <>
      <ListaMobile avaliacoes={avaliacoes} />
      <TabelaDesktop avaliacoes={avaliacoes} />
    </>
  )
}
