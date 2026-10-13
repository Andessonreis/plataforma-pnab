import Link from 'next/link'
import { botaoPrimario, campo, rotuloCampo } from '@/app/admin/memorial/_ui'
import { IconCalendar, IconChevronDown } from '@/components/ui'

interface Props {
  de: string
  ate: string
  atalhos: { rotulo: string; de: string; ate: string }[]
}

const ROTA = '/admin/memorial/agendamentos/relatorio'

/**
 * Escolha do período: atalhos num controle segmentado e, para datas exatas, um bloco que
 * abre sozinho quando o período atual não é nenhum dos atalhos.
 */
export function PeriodoRelatorio({ de, ate, atalhos }: Props) {
  const ehAtalho = atalhos.some((a) => a.de === de && a.ate === ate)
  return (
    <div className="space-y-3">
      <nav aria-label="Períodos prontos" className="grid grid-cols-2 gap-1 rounded-xl bg-papel-50 p-1 ring-1 ring-tinta-900/15 sm:inline-flex">
        {atalhos.map((a) => {
          const ativo = a.de === de && a.ate === ate
          return (
            <Link
              key={a.rotulo}
              href={`${ROTA}?de=${a.de}&ate=${a.ate}`}
              aria-current={ativo ? 'page' : undefined}
              className={`inline-flex min-h-[44px] items-center justify-center rounded-lg px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent-500 ${
                ativo ? 'bg-tinta-900 text-white' : 'text-tinta-800 hover:bg-papel-100'
              }`}
            >
              {a.rotulo}
            </Link>
          )
        })}
      </nav>

      <details open={!ehAtalho} className="group">
        <summary className="inline-flex min-h-[44px] cursor-pointer list-none items-center gap-2 rounded-lg text-sm font-semibold text-brand-700 focus-visible:outline-2 focus-visible:outline-accent-500 [&::-webkit-details-marker]:hidden">
          <IconCalendar className="h-4 w-4" />
          Escolher datas
          <IconChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
        </summary>
        <form action={ROTA} className="mt-2 grid grid-cols-2 gap-3 sm:flex sm:items-end">
          <label>
            <span className={rotuloCampo}>De</span>
            <input type="date" name="de" defaultValue={de} className={campo} />
          </label>
          <label>
            <span className={rotuloCampo}>Até</span>
            <input type="date" name="ate" defaultValue={ate} className={campo} />
          </label>
          <button type="submit" className={`${botaoPrimario} col-span-2`}>
            Ver período
          </button>
        </form>
      </details>
    </div>
  )
}
