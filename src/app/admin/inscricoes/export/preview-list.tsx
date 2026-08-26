import { Badge } from '@/components/ui'
import { inscricaoStatusLabel, inscricaoStatusVariant } from '@/lib/status-maps'
import { formatTelefoneBR } from '@/lib/utils/format'
import type { InscricaoStatus } from '@prisma/client'

export interface PreviewItem {
  id: string
  numero: string
  status: InscricaoStatus
  notaFinal: unknown
  submittedAt: Date | null
  edital: { titulo: string }
  proponente: {
    nome: string
    cpfCnpj: string | null
    email: string
    telefone: string | null
  }
}

interface PreviewListProps {
  items: PreviewItem[]
  total: number
  limit: number
  /** Quando há edital filtrado, a coluna de edital é redundante e some. */
  showEdital: boolean
}

function formatData(value: Date | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

function formatNota(value: unknown): string {
  return value ? Number(value).toFixed(2) : '—'
}

export default function PreviewList({ items, total, limit, showEdital }: PreviewListProps) {
  if (total === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 py-14 text-center">
        <p className="text-sm text-slate-500">Nenhuma inscrição encontrada.</p>
        <p className="mt-1 text-xs text-slate-400">Ajuste os filtros acima.</p>
      </div>
    )
  }

  const restante = total - limit

  return (
    <>
      {/* Cards — mobile */}
      <div className="sm:hidden space-y-2">
        {items.map((i) => (
          <div key={i.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-800 text-sm leading-snug">{i.proponente.nome}</p>
                <p className="text-xs text-slate-400 mt-0.5">{i.proponente.email}</p>
                {i.proponente.telefone && (
                  <a
                    href={`tel:${i.proponente.telefone.replace(/\D/g, '')}`}
                    className="mt-1 inline-block text-xs font-medium text-brand-600 hover:text-brand-700"
                  >
                    {formatTelefoneBR(i.proponente.telefone)}
                  </a>
                )}
              </div>
              <div className="shrink-0">
                <Badge variant={inscricaoStatusVariant[i.status]}>
                  {inscricaoStatusLabel[i.status]}
                </Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 border-t border-slate-100 pt-2">
              <span className="font-mono text-slate-400">#{i.numero}</span>
              {i.proponente.cpfCnpj && <span className="font-mono">{i.proponente.cpfCnpj}</span>}
              {showEdital && (
                <span className="truncate max-w-[200px] text-slate-400">{i.edital.titulo}</span>
              )}
              {i.submittedAt && <span>{formatData(i.submittedAt)}</span>}
            </div>
          </div>
        ))}
        {restante > 0 && (
          <p className="text-center text-xs text-slate-400 py-2">
            + {restante.toLocaleString('pt-BR')} não exibidas — incluídas no CSV
          </p>
        )}
      </div>

      {/* Tabela — sm+ */}
      <div className="hidden sm:block rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-[80px]">#</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Proponente</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">CPF/CNPJ</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Telefone</th>
                {showEdital && (
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Edital</th>
                )}
                <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-slate-500 uppercase tracking-wider hidden lg:table-cell">Nota</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap hidden lg:table-cell">Enviada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {items.map((i) => (
                <tr key={i.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-3 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">{i.numero}</td>
                  <td className="px-3 py-3 max-w-[200px]">
                    <p className="font-medium text-slate-800 truncate text-sm">{i.proponente.nome}</p>
                    <p className="text-xs text-slate-400 truncate">{i.proponente.email}</p>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">
                    {i.proponente.cpfCnpj ?? '—'}
                  </td>
                  <td className="px-3 py-3 text-xs whitespace-nowrap">
                    {i.proponente.telefone ? (
                      <a
                        href={`tel:${i.proponente.telefone.replace(/\D/g, '')}`}
                        className="font-medium text-brand-600 hover:text-brand-700"
                      >
                        {formatTelefoneBR(i.proponente.telefone)}
                      </a>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  {showEdital && (
                    <td className="px-3 py-3 max-w-[160px] hidden md:table-cell">
                      <span className="text-xs text-slate-600 truncate block">{i.edital.titulo}</span>
                    </td>
                  )}
                  <td className="px-3 py-3 whitespace-nowrap">
                    <Badge variant={inscricaoStatusVariant[i.status]}>
                      {inscricaoStatusLabel[i.status]}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 text-right text-xs text-slate-600 tabular-nums hidden lg:table-cell">
                    {formatNota(i.notaFinal)}
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-400 whitespace-nowrap hidden lg:table-cell">
                    {formatData(i.submittedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {restante > 0 && (
          <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5">
            <span className="text-xs text-slate-400">
              + {restante.toLocaleString('pt-BR')} não exibidas — incluídas no CSV
            </span>
          </div>
        )}
      </div>
    </>
  )
}
