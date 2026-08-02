import Link from 'next/link'
import { Card, Badge, EmptyState, IconUsers } from '@/components/ui'
import { inscricaoStatusLabel, inscricaoStatusVariant } from '@/lib/status-maps'

interface InscritoRecente {
  id: string
  numero: string
  categoria: string | null
  status: string
  createdAt: Date
  proponente: { nome: string }
}

interface InscritosRecentesProps {
  editalId: string
  total: number
  inscritos: InscritoRecente[]
}

/** Prévia dos últimos inscritos do edital — mesma composição usada no painel da secretaria. */
export function InscritosRecentes({ editalId, total, inscritos }: InscritosRecentesProps) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900">Inscritos Recentes</h2>
        <Link
          href={`/admin/inscricoes?editalId=${editalId}`}
          className="text-sm text-brand-600 hover:text-brand-700 font-medium"
        >
          Ver todos ({total})
        </Link>
      </div>

      {inscritos.length === 0 ? (
        <EmptyState
          icon={<IconUsers className="h-8 w-8 text-slate-400" />}
          title="Nenhuma inscrição ainda"
          description="Os proponentes que se inscreverem neste edital aparecerão aqui."
        />
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="sm:hidden divide-y divide-slate-100 -mx-4">
            {inscritos.map((ins) => (
              <Link
                key={ins.id}
                href={`/admin/inscricoes/${ins.id}?from=edital&editalId=${editalId}`}
                className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
              >
                <div className="h-8 w-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-brand-700">
                    {ins.proponente.nome.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{ins.proponente.nome}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-mono text-slate-400">{ins.numero}</span>
                    {ins.categoria && <span className="text-[11px] text-slate-400">· {ins.categoria}</span>}
                  </div>
                </div>
                <Badge variant={inscricaoStatusVariant[ins.status as keyof typeof inscricaoStatusVariant]}>
                  {inscricaoStatusLabel[ins.status as keyof typeof inscricaoStatusLabel]}
                </Badge>
              </Link>
            ))}
          </div>

          {/* Desktop: lista */}
          <div className="hidden sm:block divide-y divide-slate-100">
            {inscritos.map((ins) => (
              <Link
                key={ins.id}
                href={`/admin/inscricoes/${ins.id}?from=edital&editalId=${editalId}`}
                className="flex items-center gap-3 py-3 hover:bg-slate-50/50 transition-colors rounded-lg px-2 -mx-2"
              >
                <div className="h-8 w-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-brand-700">
                    {ins.proponente.nome.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{ins.proponente.nome}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {ins.numero}
                    {ins.categoria ? ` · ${ins.categoria}` : ''}
                  </p>
                </div>
                <Badge variant={inscricaoStatusVariant[ins.status as keyof typeof inscricaoStatusVariant]}>
                  {inscricaoStatusLabel[ins.status as keyof typeof inscricaoStatusLabel]}
                </Badge>
                <span className="text-xs text-slate-400 tabular-nums w-16 text-right">
                  {ins.createdAt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' })}
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </Card>
  )
}
