import type { ReactNode } from 'react'
import { IconSearch } from '@/components/ui'
import { botaoNeutro, campo } from './classes'

interface Props {
  acao: string
  q?: string
  /** Filtros que a busca preserva (situação, tipo...). */
  manter: Record<string, string | number | undefined>
  placeholder: string
  /** Painel de filtros extras, ao lado da busca no desktop e abaixo no celular. */
  children?: ReactNode
}

/** Busca única da lista, por link (funciona sem JavaScript). */
export function AcervoBusca({ acao, q, manter, placeholder, children }: Props) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <form action={acao} role="search" className="flex flex-1 gap-2">
        {Object.entries(manter).map(([k, v]) =>
          v === undefined || v === '' ? null : <input key={k} type="hidden" name={k} value={v} />,
        )}
        <label htmlFor="busca-lista" className="sr-only">
          Buscar
        </label>
        <div className="relative flex-1">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta-500" />
          <input id="busca-lista" name="q" type="search" defaultValue={q} placeholder={placeholder} className={`${campo} pl-9`} />
        </div>
        <button type="submit" className={botaoNeutro}>
          Buscar
        </button>
      </form>
      {children}
    </div>
  )
}
