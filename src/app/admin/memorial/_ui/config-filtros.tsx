import Link from 'next/link'
import type { StatusConteudo } from '@prisma/client'
import { IconSearch } from '@/components/ui'
import { STATUS_CONTEUDO, ROTULO_STATUS } from '@/lib/memorial/rotulos'
import { montarUrl } from '../_componentes/parametros'
import { botaoNeutro, campo } from './classes'

interface Props {
  /** Caminho da página com os parâmetros fixos (ex.: "/admin/memorial/pessoas?aba=eventos"). */
  base: string
  status?: StatusConteudo
  busca?: string
  /** Nome do parâmetro de busca que a lista aceita ("q" ou "busca"). */
  nomeBusca?: string
  placeholder?: string
}

/**
 * Busca e filtro por situação, tudo por link: funciona sem JavaScript e o
 * endereço pode ser guardado ou enviado para outra pessoa da equipe.
 */
export function FiltroSituacao({ base, status, busca, nomeBusca = 'q', placeholder = 'Buscar pelo nome' }: Props) {
  const url = new URL(base, 'http://local')
  const fixos = Object.fromEntries(url.searchParams)
  const opcoes = [{ valor: '', rotulo: 'Todas' }, ...STATUS_CONTEUDO.map((s) => ({ valor: s, rotulo: ROTULO_STATUS[s] }))]

  return (
    <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <nav aria-label="Filtrar por situação" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0 lg:pb-0">
        {opcoes.map((o) => {
          const atual = (status ?? '') === o.valor
          return (
            <Link
              key={o.valor || 'todas'}
              href={montarUrl(base, { status: o.valor, [nomeBusca]: busca })}
              aria-current={atual ? 'page' : undefined}
              className={`inline-flex min-h-[44px] shrink-0 items-center rounded-full px-4 text-sm font-semibold ring-1 ring-inset transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 ${
                atual ? 'bg-accent-100 text-tinta-900 ring-2 ring-accent-500' : 'bg-white text-tinta-700 ring-tinta-900/15 hover:bg-papel-100'
              }`}
            >
              {o.rotulo}
            </Link>
          )
        })}
      </nav>
      <form action={url.pathname} role="search" className="flex gap-2 lg:w-80">
        {Object.entries(fixos).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        {status && <input type="hidden" name="status" value={status} />}
        <label htmlFor="busca-memorial" className="sr-only">
          {placeholder}
        </label>
        <input id="busca-memorial" name={nomeBusca} type="search" defaultValue={busca} placeholder={placeholder} className={campo} />
        <button type="submit" className={`${botaoNeutro} px-3`} aria-label="Buscar">
          <IconSearch className="h-5 w-5" />
        </button>
      </form>
    </div>
  )
}
