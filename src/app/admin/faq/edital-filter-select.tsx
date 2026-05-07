'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

interface Edital {
  id: string
  titulo: string
}

interface Props {
  editais: Edital[]
  selectedId?: string
  /** Outros filtros que precisam ser preservados ao trocar o edital */
  preserveParams?: Record<string, string | undefined>
}

/**
 * Dropdown de filtro por edital — substitui a tira de chips quando há
 * muitos editais (#admin/faq, ver mensagem do user). Mantém outros
 * filtros (status) intactos ao mudar o valor.
 */
export function EditalFilterSelect({ editais, selectedId, preserveParams }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleChange(value: string) {
    const params = new URLSearchParams()
    if (value) params.set('editalId', value)
    if (preserveParams) {
      for (const [k, v] of Object.entries(preserveParams)) {
        if (v) params.set(k, v)
      }
    }
    const qs = params.toString()
    startTransition(() => {
      router.push(qs ? `/admin/faq?${qs}` : '/admin/faq')
    })
  }

  return (
    <label className="flex flex-wrap gap-2 items-center">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Edital:</span>
      <select
        value={selectedId ?? ''}
        onChange={(e) => handleChange(e.target.value)}
        disabled={pending}
        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 min-h-[36px] max-w-full sm:max-w-[320px] truncate disabled:opacity-60"
      >
        <option value="">Todos</option>
        {editais.map((e) => (
          <option key={e.id} value={e.id}>
            {e.titulo}
          </option>
        ))}
      </select>
    </label>
  )
}
