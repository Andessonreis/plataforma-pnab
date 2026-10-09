import Link from 'next/link'
import { montarUrl } from '@/app/admin/memorial/_componentes/parametros'
import type { Escala } from './periodo-calendario'

interface AbasVisaoProps {
  visao: 'lista' | 'calendario'
  escala: Escala
  status?: string
  busca?: string
}

const BASE = '/admin/memorial/agendamentos'

function Aba({ href, ativo, children }: { href: string; ativo: boolean; children: string }) {
  return (
    <Link
      href={href}
      aria-current={ativo ? 'page' : undefined}
      className={`inline-flex min-h-[44px] items-center rounded-full px-4 text-sm font-medium ${
        ativo ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      }`}
    >
      {children}
    </Link>
  )
}

/** Troca entre lista e calendário (mês, semana, dia), mantendo os filtros. */
export function AbasVisao({ visao, escala, status, busca }: AbasVisaoProps) {
  const escalas: [Escala, string][] = [
    ['mes', 'Mês'],
    ['semana', 'Semana'],
    ['dia', 'Dia'],
  ]
  return (
    <nav aria-label="Forma de ver a agenda" className="mb-4 flex flex-wrap gap-2">
      <Aba href={montarUrl(BASE, { status, busca })} ativo={visao === 'lista'}>
        Lista
      </Aba>
      {escalas.map(([e, rotulo]) => (
        <Aba key={e} href={montarUrl(BASE, { visao: 'calendario', escala: e, status, busca })} ativo={visao === 'calendario' && escala === e}>
          {rotulo}
        </Aba>
      ))}
    </nav>
  )
}
