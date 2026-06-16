import Link from 'next/link'
import { Badge } from '@client/components/ui'
import { viewNotaTotal } from '@/lib/services/avaliacao-view'

export interface RankingInscricao {
  id: string
  numero: string
  edital: { titulo: string; ano: number }
  proponente: { nome: string; cpfCnpj: string | null }
  avaliacoes: { finalizada: boolean; notaTotal: unknown }[]
}

interface RankingTableProps {
  inscricoes: RankingInscricao[]
  editalId: string
  abaAtiva: string
}

/** Resumo das avaliações de uma inscrição: atribuídos, finalizadas e nota média (só finalizadas). */
function resumoAvaliacoes(avaliacoes: { finalizada: boolean; notaTotal: unknown }[]) {
  const atribuidos = avaliacoes.length
  const finalizadas = avaliacoes.filter((a) => a.finalizada).length
  const notas = avaliacoes
    .map((a) => viewNotaTotal(a))
    .filter((n): n is number => n !== null)
  const media =
    notas.length > 0
      ? (notas.reduce((acc, n) => acc + n, 0) / notas.length).toFixed(2)
      : null
  return { atribuidos, finalizadas, media }
}

export function RankingTable({ inscricoes, editalId, abaAtiva }: RankingTableProps) {
  function detalheHref(inscricaoId: string) {
    const sp = new URLSearchParams()
    sp.set('from', 'avaliacao')
    sp.set('editalId', editalId)
    sp.set('aba', abaAtiva)
    return `/admin/inscricoes/${inscricaoId}?${sp.toString()}`
  }

  return (
    <>
      {/* Mobile: lista de cards */}
      <ul className="sm:hidden space-y-3" aria-label="Inscrições">
        {inscricoes.map((inscricao) => {
          const { atribuidos, finalizadas, media } = resumoAvaliacoes(inscricao.avaliacoes)
          return (
            <li key={inscricao.id}>
              <Link
                href={detalheHref(inscricao.id)}
                className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-brand-300 hover:shadow-sm transition-all"
              >
                <p className="text-sm font-semibold text-slate-900 leading-snug mb-1">
                  {inscricao.proponente.nome}
                </p>
                <p className="text-xs text-slate-500 leading-snug line-clamp-1 mb-2">
                  {inscricao.edital.titulo} ({inscricao.edital.ano})
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-mono">{inscricao.numero}</span>
                  <div className="flex items-center gap-3">
                    <span>{finalizadas}/{atribuidos} avaliações</span>
                    <span className="font-semibold text-brand-700">
                      {media === null ? '—' : `méd. ${media}`}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>

      {/* Desktop: tabela */}
      <div className="hidden sm:block rounded-xl border border-slate-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Número</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Proponente</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Avaliações</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Nota média</th>
              <th className="text-right py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Ação</th>
            </tr>
          </thead>
          <tbody>
            {inscricoes.map((inscricao) => {
              const { atribuidos, finalizadas, media } = resumoAvaliacoes(inscricao.avaliacoes)
              const completo = atribuidos > 0 && finalizadas === atribuidos
              return (
                <tr key={inscricao.id} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-700">{inscricao.numero}</td>
                  <td className="py-3.5 px-4">
                    <p className="font-medium text-slate-900">{inscricao.proponente.nome}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{inscricao.proponente.cpfCnpj}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    {atribuidos === 0 ? (
                      <span className="text-slate-400 text-xs">Sem avaliadores</span>
                    ) : (
                      <Badge variant={completo ? 'success' : 'warning'}>
                        {finalizadas}/{atribuidos} finalizadas
                      </Badge>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-brand-700 tabular-nums">
                    {media === null ? <span className="text-slate-400 font-normal">—</span> : media}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={detalheHref(inscricao.id)}
                      className="inline-flex items-center gap-1 text-brand-700 hover:text-brand-800 font-medium text-sm"
                    >
                      Ver detalhes
                      <span aria-hidden>→</span>
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
