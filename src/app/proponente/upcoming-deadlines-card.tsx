import Link from 'next/link'
import { IconCalendar } from '@/components/ui'
import { formatDate, parseBrazilDateTime } from '@/lib/utils/format'

export interface UpcomingDeadline {
  editalId: string
  editalTitulo: string
  slug: string
  label: string
  dataHora: string
}

interface UpcomingDeadlinesCardProps {
  deadlines: UpcomingDeadline[]
}

// Texto de contagem regressiva curto — arredonda pra cima pra não subestimar
// prazo (ex.: faltando 23h ainda mostra "Falta 1 dia", não "Encerra hoje").
// Reaproveitado pelo DashboardHero pro prazo mais urgente da tela.
export function contagemRegressiva(dataHora: string): string {
  const alvo = parseBrazilDateTime(dataHora)
  const dias = Math.ceil((alvo.getTime() - Date.now()) / 86_400_000)
  if (dias <= 0) return 'Encerra hoje'
  if (dias === 1) return 'Falta 1 dia'
  return `Faltam ${dias} dias`
}

// Lista compacta de prazos — sem cartão próprio, pra ser empilhada dentro do
// painel lateral do dashboard (DashboardSidebar) junto de rascunhos e notificações.
export function UpcomingDeadlinesCard({ deadlines }: UpcomingDeadlinesCardProps) {
  return (
    <div>
      <h3 className="titulo text-lg text-tinta-950">Próximos prazos</h3>

      {deadlines.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">Nenhum prazo em aberto no momento.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {deadlines.map((deadline) => (
            <li key={`${deadline.editalId}-${deadline.label}`}>
              <Link
                href={`/editais/${deadline.slug}`}
                className="flex items-start gap-2.5 rounded-lg px-2.5 py-2 -mx-2.5 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
              >
                <IconCalendar className="h-4 w-4 shrink-0 mt-0.5 text-accent-600" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 leading-snug truncate">{deadline.label}</p>
                  <p className="text-xs text-slate-500 truncate">{deadline.editalTitulo}</p>
                  <p className="mt-0.5 text-xs font-medium text-accent-700">
                    {contagemRegressiva(deadline.dataHora)} · {formatDate(deadline.dataHora)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
