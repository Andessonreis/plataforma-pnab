'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Select } from '@/components/ui'

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
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const editalOptions = [
    { value: '', label: 'Todos os editais' },
    ...editais.map((e) => ({
      value: e.id,
      label: `${e.titulo} (${e.ano})`,
    })),
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Select
        label="Edital"
        value={selectedEditalId ?? ''}
        options={editalOptions}
        onChange={(e) => update('editalId', e.target.value)}
      />
      <Select
        label="Status"
        value={selectedStatus ?? ''}
        options={STATUS_OPTIONS}
        onChange={(e) => update('status', e.target.value)}
      />
    </div>
  )
}
