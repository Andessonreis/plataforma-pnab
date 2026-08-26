'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { SEM_AREA, labelArea } from '@/lib/inscricoes/area-filter'

export interface AreaOption {
  /** Nome da área como está gravado na inscrição (''= sem área definida). */
  nome: string
  total: number
}

interface FilterFormProps {
  editais: { id: string; titulo: string; ano: number }[]
  areas: AreaOption[]
  selectedEditalId?: string
  selectedStatus?: string
  selectedArea?: string
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

export default function FilterForm({
  editais,
  areas,
  selectedEditalId,
  selectedStatus,
  selectedArea,
}: FilterFormProps) {
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

  const hasFilters = !!selectedEditalId || !!selectedStatus || !!selectedArea
  const selectClass = 'w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500'

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="filter-area">
            Área
          </label>
          <select
            id="filter-area"
            value={selectedArea ?? ''}
            onChange={(e) => update('categoria', e.target.value)}
            className={selectClass}
            disabled={areas.length === 0}
          >
            <option value="">Todas as áreas</option>
            {areas.map((a) => (
              <option key={a.nome || SEM_AREA} value={a.nome || SEM_AREA}>
                {labelArea(a.nome)} ({a.total})
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
