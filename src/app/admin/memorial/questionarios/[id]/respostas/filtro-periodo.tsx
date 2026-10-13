import Link from 'next/link'
import { botaoNeutro, campo } from '@/app/admin/memorial/_ui'
import { diaAtras, type Periodo } from './periodo'

const ATALHOS = [
  { rotulo: 'Últimos 7 dias', dias: 7 },
  { rotulo: 'Últimos 30 dias', dias: 30 },
]

const chip = (ativo: boolean) =>
  `inline-flex min-h-[44px] shrink-0 items-center rounded-full px-4 text-sm font-semibold ring-1 ring-inset focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 ${
    ativo ? 'bg-accent-100 text-tinta-900 ring-2 ring-accent-500' : 'bg-white text-tinta-700 ring-tinta-900/15 hover:bg-papel-100'
  }`

/** Período das respostas: atalhos de um toque e, para casos específicos, as duas datas. */
export function FiltroPeriodo({ base, periodo }: { base: string; periodo: Periodo }) {
  const semFiltro = !periodo.de && !periodo.ate
  return (
    <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <nav aria-label="Período" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0 lg:pb-0">
        <Link href={base} aria-current={semFiltro ? 'page' : undefined} className={chip(semFiltro)}>Todas</Link>
        {ATALHOS.map((a) => {
          const de = diaAtras(a.dias)
          const ativo = periodo.de === de && !periodo.ate
          return (
            <Link key={a.dias} href={`${base}?de=${de}`} aria-current={ativo ? 'page' : undefined} className={chip(ativo)}>
              {a.rotulo}
            </Link>
          )
        })}
      </nav>
      <form action={base} className="grid grid-cols-2 items-end gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <label className="min-w-0 text-sm font-semibold text-tinta-900">
          De
          <input type="date" name="de" defaultValue={periodo.de} className={`${campo} mt-1`} />
        </label>
        <label className="min-w-0 text-sm font-semibold text-tinta-900">
          Até
          <input type="date" name="ate" defaultValue={periodo.ate} className={`${campo} mt-1`} />
        </label>
        <button type="submit" className={`${botaoNeutro} col-span-2 sm:col-span-1`}>Filtrar</button>
      </form>
    </div>
  )
}
