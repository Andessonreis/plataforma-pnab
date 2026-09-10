import Link from 'next/link'
import { Card } from '@/components/ui'

export interface LinhaInscricao {
  id: string
  numero: string
  categoria: string | null
  proponenteNome: string
  proponenteCpfCnpj: string | null
  /** Nota da avaliação deste avaliador; null enquanto não estiver finalizada. */
  nota: number | null
}

function Situacao({ nota, compacto = false }: { nota: number | null; compacto?: boolean }) {
  const base = compacto ? 'text-[11px]' : 'text-xs'
  return (
    <span
      className={`inline-flex items-center gap-1 shrink-0 font-medium px-2 py-0.5 rounded-full ${base} ${
        nota === null ? 'text-amber-700 bg-amber-50' : 'text-emerald-700 bg-emerald-50'
      }`}
    >
      {nota === null ? 'Pendente' : `Nota: ${nota}`}
    </span>
  )
}

export function ListaInscricoes({ inscricoes }: { inscricoes: LinhaInscricao[] }) {
  return (
    <>
      <div className="sm:hidden space-y-3">
        {inscricoes.map((ins) => (
          <Link
            key={ins.id}
            href={`/avaliador/inscricoes/${ins.id}`}
            className="block rounded-lg border border-slate-200 bg-white p-3.5 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <p className="text-sm font-medium text-slate-900">{ins.proponenteNome}</p>
              <Situacao nota={ins.nota} compacto />
            </div>
            {ins.categoria && (
              <p className="text-xs text-slate-500 mb-1 line-clamp-1">{ins.categoria}</p>
            )}
            <span className="text-[11px] font-mono text-slate-400">{ins.numero}</span>
          </Link>
        ))}
      </div>

      <Card padding="sm" className="overflow-hidden hidden sm:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left py-3 px-4 font-medium text-slate-600">Inscrição</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Proponente</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Categoria</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Avaliação</th>
                <th className="text-right py-3 px-4 font-medium text-slate-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {inscricoes.map((ins) => (
                <tr key={ins.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs">{ins.numero}</td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-900">{ins.proponenteNome}</p>
                    <p className="text-xs text-slate-500">{ins.proponenteCpfCnpj ?? '—'}</p>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{ins.categoria ?? '—'}</td>
                  <td className="py-3 px-4">
                    <Situacao nota={ins.nota} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/avaliador/inscricoes/${ins.id}`}
                      className="text-brand-600 hover:text-brand-700 font-medium text-xs"
                    >
                      {ins.nota === null ? 'Avaliar' : 'Ver'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
