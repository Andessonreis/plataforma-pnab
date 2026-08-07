import { IconSearch } from '@/components/ui/icons'

interface DuvidasBuscaProps {
  valor: string
  aoMudar: (valor: string) => void
  buscando: boolean
  encontradas: number
}

/**
 * Campo de busca único, cruzando pergunta e resposta de todos os cadernos
 * (gerais e por edital), mais o contador de resultados.
 *
 * Só a UI: o estado da busca mora no orquestrador (`CadernoDuvidas`).
 */
export function DuvidasBusca({ valor, aoMudar, buscando, encontradas }: DuvidasBuscaProps) {
  return (
    <div>
      <label className="block">
        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-tinta-500">
          Buscar nas dúvidas
        </span>
        <span className="relative block">
          <IconSearch
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-tinta-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={valor}
            onChange={(e) => aoMudar(e.target.value)}
            placeholder="prazo, documentos, recurso..."
            className="min-h-[44px] w-full border-2 border-tinta-900/20 bg-papel-50 py-3.5 pl-12 pr-4 text-base text-tinta-900 placeholder:text-tinta-400 focus:border-accent-500 focus:outline-none"
          />
        </span>
      </label>

      {buscando && (
        <p className="mt-3 text-sm text-tinta-600" role="status">
          {encontradas === 0
            ? 'Nenhuma dúvida corresponde à busca.'
            : `${encontradas} ${encontradas === 1 ? 'dúvida encontrada' : 'dúvidas encontradas'}.`}
        </p>
      )}
    </div>
  )
}
