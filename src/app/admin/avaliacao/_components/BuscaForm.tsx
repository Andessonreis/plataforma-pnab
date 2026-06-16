import Link from 'next/link'
import { IconSearch } from '@client/components/ui'

interface BuscaFormProps {
  editalId: string
  abaAtiva: string
  searchQuery: string | undefined
  total: number
}

export function BuscaForm({ editalId, abaAtiva, searchQuery, total }: BuscaFormProps) {
  if (!(total > 0 || searchQuery)) return null

  return (
    <form method="get" action="/admin/avaliacao" className="mb-5 sm:mb-6">
      <input type="hidden" name="editalId" value={editalId} />
      <input type="hidden" name="aba" value={abaAtiva} />
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            id="search"
            name="search"
            type="text"
            defaultValue={searchQuery}
            placeholder="Buscar por nome, CPF/CNPJ ou número da inscrição"
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
          {searchQuery && (
            <Link
              href={`/admin/avaliacao?editalId=${editalId}&aba=${abaAtiva}`}
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
