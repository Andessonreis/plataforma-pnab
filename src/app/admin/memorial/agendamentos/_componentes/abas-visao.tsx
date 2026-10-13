import Link from 'next/link'
import { montarUrl } from '@/app/admin/memorial/_componentes/parametros'
import type { AbaAgenda, ContagemAbas } from '@/lib/services/memorial-agenda-abas.service'

const BASE = '/admin/memorial/agendamentos'

const ABAS: { aba: AbaAgenda; rotulo: string }[] = [
  { aba: 'responder', rotulo: 'Para responder' },
  { aba: 'confirmadas', rotulo: 'Confirmadas' },
  { aba: 'realizadas', rotulo: 'Realizadas' },
  { aba: 'todas', rotulo: 'Todas' },
]

/** Abas por tarefa, com quantos pedidos há em cada. "Para responder" acende quando há pendência. */
export function AbasAgenda({ ativa, contagem, busca }: { ativa: AbaAgenda; contagem: ContagemAbas; busca?: string }) {
  return (
    <nav aria-label="Pedidos por situação" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-1 border-b border-tinta-900/15">
        {ABAS.map(({ aba, rotulo }) => {
          const ativo = aba === ativa
          const alerta = aba === 'responder' && contagem.responder > 0
          return (
            <li key={aba}>
              <Link
                href={montarUrl(BASE, { aba, busca })}
                aria-current={ativo ? 'page' : undefined}
                className={`-mb-px inline-flex min-h-[48px] items-center gap-2 border-b-[3px] px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-500 ${
                  ativo ? 'border-accent-500 text-tinta-900' : 'border-transparent text-tinta-600 hover:text-tinta-900'
                }`}
              >
                {rotulo}
                <span
                  className={`min-w-[1.75rem] rounded-full px-2 py-0.5 text-center text-xs font-bold tabular-nums ${
                    alerta ? 'bg-accent-500 text-tinta-950' : 'bg-tinta-900/10 text-tinta-800'
                  }`}
                >
                  {contagem[aba]}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/** Alterna entre lista e calendário. Os filtros de texto seguem junto. */
export function AlternarVisao({ visao, busca }: { visao: 'lista' | 'calendario'; busca?: string }) {
  const opcoes = [
    { valor: 'lista', rotulo: 'Lista', href: montarUrl(BASE, { busca }) },
    { valor: 'calendario', rotulo: 'Calendário', href: montarUrl(BASE, { visao: 'calendario', escala: 'semana', busca }) },
  ] as const
  return (
    <nav aria-label="Forma de ver a agenda" className="inline-flex rounded-lg border border-tinta-900/20 bg-white p-1">
      {opcoes.map((o) => (
        <Link
          key={o.valor}
          href={o.href}
          aria-current={visao === o.valor ? 'page' : undefined}
          className={`inline-flex min-h-[44px] items-center rounded-md px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-accent-500 ${
            visao === o.valor ? 'bg-tinta-900 text-white' : 'text-tinta-700 hover:bg-papel-100'
          }`}
        >
          {o.rotulo}
        </Link>
      ))}
    </nav>
  )
}
