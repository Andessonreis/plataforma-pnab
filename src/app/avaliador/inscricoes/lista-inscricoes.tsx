import Link from 'next/link'
import { Badge } from '@/components/ui'

export interface LinhaInscricao {
  id: string
  numero: string
  categoria: string | null
  proponenteNome: string
  proponenteCpfCnpj: string | null
  /** Nota da avaliação deste avaliador; null enquanto não estiver finalizada. */
  nota: number | null
}

/** Pendente sai em dourado (accent) e avaliada em terracota (brand) — os mesmos
 *  pares que `Badge` usa no resto do backoffice pra "falta fazer" e "concluído". */
function Situacao({ nota }: { nota: number | null }) {
  return (
    <Badge variant={nota === null ? 'warning' : 'success'} dot>
      {nota === null ? 'Pendente' : `Nota ${nota}`}
    </Badge>
  )
}

export function ListaInscricoes({ inscricoes }: { inscricoes: LinhaInscricao[] }) {
  return (
    <>
      <ul className="sm:hidden space-y-3" aria-label="Inscrições">
        {inscricoes.map((ins) => (
          <li key={ins.id}>
            <Link
              href={`/avaliador/inscricoes/${ins.id}`}
              className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-brand-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <p className="text-sm font-semibold text-slate-900 leading-snug">{ins.proponenteNome}</p>
                <Situacao nota={ins.nota} />
              </div>
              {ins.categoria && (
                <p className="text-xs text-slate-500 mb-1 line-clamp-1">{ins.categoria}</p>
              )}
              <span className="text-[11px] font-mono text-slate-500">{ins.numero}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="hidden sm:block rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Inscrição</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Proponente</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Categoria</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Sua avaliação</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Ação</th>
              </tr>
            </thead>
            <tbody>
              {inscricoes.map((ins) => (
                <tr key={ins.id} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-700">{ins.numero}</td>
                  <td className="py-3.5 px-4">
                    <p className="font-medium text-slate-900">{ins.proponenteNome}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{ins.proponenteCpfCnpj ?? '—'}</p>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{ins.categoria ?? '—'}</td>
                  <td className="py-3.5 px-4">
                    <Situacao nota={ins.nota} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/avaliador/inscricoes/${ins.id}`}
                      className="inline-flex items-center gap-1 text-brand-700 hover:text-brand-800 font-medium text-sm"
                    >
                      {ins.nota === null ? 'Avaliar' : 'Ver detalhes'}
                      <span aria-hidden>→</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
