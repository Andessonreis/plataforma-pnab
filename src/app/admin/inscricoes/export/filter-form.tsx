'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

interface FilterFormProps {
  editais: { id: string; titulo: string; ano: number }[]
  selectedEditalId?: string
  selectedStatus?: string
}

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'RASCUNHO', label: 'Rascunho' },
  { value: 'ENVIADA', label: 'Enviada' },
  { value: 'HABILITADA', label: 'Habilitada' },
  { value: 'INABILITADA', label: 'Inabilitada' },
  { value: 'EM_AVALIACAO', label: 'Em Avaliação' },
  { value: 'RESULTADO_PRELIMINAR', label: 'Resultado Preliminar' },
  { value: 'RECURSO_ABERTO', label: 'Recurso Aberto' },
  { value: 'RESULTADO_FINAL', label: 'Resultado Final' },
  { value: 'CONTEMPLADA', label: 'Contemplada' },
  { value: 'NAO_CONTEMPLADA', label: 'Não Contemplada' },
  { value: 'SUPLENTE', label: 'Suplente' },
]

export default function FilterForm({ editais, selectedEditalId, selectedStatus }: FilterFormProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`${pathname}?${params.toString()}`)
  }

  function clearAll() {
    router.push(pathname)
  }

  const hasFilters = !!selectedEditalId || !!selectedStatus
  const selectClass = 'w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500'

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="filter-edital">
            Edital
          </label>
          <select
            id="filter-edital"
            value={selectedEditalId ?? ''}
            onChange={(e) => update('editalId', e.target.value)}
            className={selectClass}
          >
            <option value="">Todos os editais</option>
            {editais.map((e) => (
              <option key={e.id} value={e.id}>
                {e.titulo} ({e.ano})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="filter-status">
            Status
          </label>
          <select
            id="filter-status"
            value={selectedStatus ?? ''}
            onChange={(e) => update('status', e.target.value)}
            className={selectClass}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={clearAll}
          className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2"
        >
          Limpar filtros
        </button>
      )}
    </div>
  )
}
