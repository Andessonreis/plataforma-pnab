import type { EditalStatus } from '@prisma/client'
import { FilterTabs } from '@/components/ui'
import { editalStatusLabel } from '@/lib/status-maps'

const ALL_STATUSES: EditalStatus[] = [
  'RASCUNHO', 'PUBLICADO', 'INSCRICOES_ABERTAS', 'INSCRICOES_ENCERRADAS',
  'HABILITACAO', 'AVALIACAO', 'RESULTADO_PRELIMINAR', 'RECURSO',
  'RESULTADO_FINAL', 'ENCERRADO',
]

const TODOS_KEY = '__TODOS__'

interface EditalStatusFilterProps {
  activeStatus?: string
}

function EditalStatusFilter({ activeStatus }: EditalStatusFilterProps) {
  const tabs = [
    { key: TODOS_KEY, label: 'Todos', href: '/admin/editais' },
    ...ALL_STATUSES.map((status) => ({
      key: status,
      label: editalStatusLabel[status],
      href: `/admin/editais?status=${status}`,
    })),
  ]

  return (
    <div className="mb-4 sm:mb-6 overflow-x-auto pb-2 scrollbar-hide">
      <FilterTabs
        tabs={tabs}
        activeKey={activeStatus ?? TODOS_KEY}
        ariaLabel="Filtrar editais por status"
      />
    </div>
  )
}

export { EditalStatusFilter }
