import Link from 'next/link'
import { IconSearch } from '@/components/ui'

interface Props {
  /** Rota que recebe o GET — os filtros ficam na URL, então a busca é compartilhável. */
  action: string
  /** Filtros já ativos que precisam sobreviver ao submit (edital, aba...). */
  campos?: Record<string, string>
  placeholder: string
  valor?: string
  /** Destino do "Limpar": a mesma tela sem o termo buscado. */
  limparHref: string
  className?: string
}

export function BuscaFiltro({
  action,
  campos,
  placeholder,
  valor,
  limparHref,
  className = 'mb-5 sm:mb-6',
}: Props) {
  return (
    <form method="get" action={action} className={className}>
      {campos &&
        Object.entries(campos).map(([nome, v]) => (
          <input key={nome} type="hidden" name={nome} value={v} />
        ))}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            id="search"
            name="search"
            type="text"
            defaultValue={valor}
            placeholder={placeholder}
            aria-label="Buscar inscrições"
            className="block w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 min-h-[44px]"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition-colors"
          >
            Buscar
          </button>
          {valor && (
            <Link
              href={limparHref}
              className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors"
            >
              Limpar
            </Link>
          )}
        </div>
      </div>
    </form>
  )
}
