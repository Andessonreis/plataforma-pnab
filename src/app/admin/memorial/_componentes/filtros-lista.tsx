import Link from 'next/link'
import { STATUS_CONTEUDO, ROTULO_STATUS } from '@/lib/memorial/rotulos'
import { montarUrl } from './parametros'

interface FiltrosListaProps {
  /** Caminho da página, com parâmetros fixos (ex.: "/admin/memorial/pessoas?aba=eventos"). */
  base: string
  status?: string
  q?: string
  /** Esconde o filtro de status (álbuns não têm etapa editorial). */
  semStatus?: boolean
}

/** Busca por texto e filtro de etapa, por link (funciona sem JavaScript). */
export function FiltrosLista({ base, status, q, semStatus }: FiltrosListaProps) {
  const url = new URL(base, 'http://local')
  const fixos = Object.fromEntries(url.searchParams)
  const opcoes = [{ valor: '', rotulo: 'Todos' }, ...STATUS_CONTEUDO.map((s) => ({ valor: s, rotulo: ROTULO_STATUS[s] }))]

  return (
    <div className="mb-5 space-y-3">
      <form action={url.pathname} className="flex gap-2" role="search">
        {Object.entries(fixos).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        {status && <input type="hidden" name="status" value={status} />}
        <label htmlFor="filtro-q" className="sr-only">
          Buscar
        </label>
        <input
          id="filtro-q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Buscar pelo nome ou texto"
          className="min-h-[44px] w-full max-w-md rounded-lg border border-slate-300 px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
        <button
          type="submit"
          className="min-h-[44px] rounded-lg bg-slate-800 px-4 text-sm font-medium text-white hover:bg-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800"
        >
          Buscar
        </button>
      </form>

      {!semStatus && (
        <nav aria-label="Filtrar por etapa" className="flex gap-2 overflow-x-auto pb-1">
          {opcoes.map((o) => {
            const ativo = (status ?? '') === o.valor
            return (
              <Link
                key={o.valor || 'todos'}
                href={montarUrl(base, { status: o.valor, q })}
                aria-current={ativo ? 'page' : undefined}
                className={`inline-flex min-h-[44px] shrink-0 items-center rounded-full px-4 text-sm font-medium ${
                  ativo ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {o.rotulo}
              </Link>
            )
          })}
        </nav>
      )}
    </div>
  )
}
