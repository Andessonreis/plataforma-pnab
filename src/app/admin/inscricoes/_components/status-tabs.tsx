import { FilterTabs } from '@/components/ui'
import { inscricaoStatusLabel } from '@/lib/status-maps'
import type { InscricaoStatus } from '@prisma/client'

const ALL_STATUSES: InscricaoStatus[] = [
  'ENVIADA', 'HABILITADA', 'INABILITADA', 'EM_AVALIACAO',
  'RESULTADO_PRELIMINAR', 'RECURSO_ABERTO', 'RESULTADO_FINAL',
  'CONTEMPLADA', 'NAO_CONTEMPLADA', 'SUPLENTE', 'RASCUNHO',
]

const TODOS_KEY = '__TODOS__'

interface StatusTabsProps {
  activeStatus?: string
  /** editalId/categoria/search já aplicados — status e page ficam de fora, os tabs cuidam do status. */
  outrosParams: URLSearchParams
  /** Habilitador não tem o que fazer com inscrição não enviada — nem oferece a aba. */
  ocultarRascunho?: boolean
}

function buildHref(params: URLSearchParams, status?: string) {
  const next = new URLSearchParams(params)
  if (status) next.set('status', status)
  const qs = next.toString()
  return `/admin/inscricoes${qs ? `?${qs}` : ''}`
}

/** Mesmo padrão de abas por status do painel Gestão de Editais (`EditalStatusFilter`) — troca de status navega direto, sem passar pelo form dos outros filtros. */
export function StatusTabs({ activeStatus, outrosParams, ocultarRascunho }: StatusTabsProps) {
  const statuses = ocultarRascunho ? ALL_STATUSES.filter((s) => s !== 'RASCUNHO') : ALL_STATUSES

  const tabs = [
    { key: TODOS_KEY, label: 'Todos', href: buildHref(outrosParams) },
    ...statuses.map((status) => ({
      key: status,
      label: inscricaoStatusLabel[status],
      href: buildHref(outrosParams, status),
    })),
  ]

  return (
    <div className="mb-4 sm:mb-6 overflow-x-auto pb-2 scrollbar-hide">
      <FilterTabs tabs={tabs} activeKey={activeStatus ?? TODOS_KEY} ariaLabel="Filtrar inscrições por status" />
    </div>
  )
}
