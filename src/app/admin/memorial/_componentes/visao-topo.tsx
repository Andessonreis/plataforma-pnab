import Link from 'next/link'
import { IconSearch } from '@/components/ui'
import { formatarDiaPorExtenso } from '@/lib/memorial/agendamento/datas'
import { campo, linkDiscreto } from '@/app/admin/memorial/_ui'

interface Props {
  nome: string
  hoje: string
  hora: number
  termo: string
  /** Frase do que espera a equipe hoje, já montada pela página. */
  resumo: string
}

function saudacao(hora: number) {
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

/** Topo da visão geral: saudação com a data, o resumo do dia e a busca compacta. */
export function VisaoTopo({ nome, hoje, hora, termo, resumo }: Props) {
  const primeiroNome = nome.split(' ')[0]
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-tinta-600 first-letter:uppercase">{formatarDiaPorExtenso(hoje)}</p>
        <h1 className="mt-1 text-2xl font-bold text-tinta-900 sm:text-3xl">
          {saudacao(hora)}, {primeiroNome}
        </h1>
        <p className="mt-1 max-w-xl text-base text-tinta-700">{resumo}</p>
      </div>

      <div className="w-full space-y-2 lg:w-80">
        <form role="search" action="/admin/memorial" className="relative">
          <label htmlFor="busca-memorial" className="sr-only">
            Buscar pessoa, foto, evento ou exposição
          </label>
          <input
            id="busca-memorial"
            name="q"
            type="search"
            defaultValue={termo}
            minLength={2}
            placeholder="Buscar no Memorial"
            className={`${campo} pr-12`}
          />
          <button
            type="submit"
            aria-label="Buscar"
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-tinta-600 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-accent-500"
          >
            <IconSearch className="h-5 w-5" />
          </button>
        </form>
        <nav aria-label="Atalhos" className="flex gap-4">
          <Link href="/admin/memorial/configuracoes" className={`${linkDiscreto} py-2`}>
            Textos e regras
          </Link>
          <a href="/memorial" target="_blank" rel="noopener noreferrer" className={`${linkDiscreto} py-2`}>
            Ver o site
          </a>
        </nav>
      </div>
    </header>
  )
}
