import Link from 'next/link'
import { botaoPrimario, campo, rotuloCampo } from '@/app/admin/memorial/_ui'

interface Props {
  de: string
  ate: string
  atalhos: { rotulo: string; de: string; ate: string }[]
}

/** Escolha do período: atalhos de um toque e, se precisar, datas exatas. */
export function PeriodoRelatorio({ de, ate, atalhos }: Props) {
  return (
    <div className="space-y-3">
      <nav aria-label="Períodos prontos" className="flex flex-wrap gap-2">
        {atalhos.map((a) => {
          const ativo = a.de === de && a.ate === ate
          return (
            <Link
              key={a.rotulo}
              href={`/admin/memorial/agendamentos/relatorio?de=${a.de}&ate=${a.ate}`}
              aria-current={ativo ? 'page' : undefined}
              className={`inline-flex min-h-[44px] items-center rounded-full border px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-accent-500 ${
                ativo ? 'border-tinta-900 bg-tinta-900 text-white' : 'border-tinta-900/20 bg-white text-tinta-800 hover:bg-papel-100'
              }`}
            >
              {a.rotulo}
            </Link>
          )
        })}
      </nav>
      <form className="grid grid-cols-2 gap-3 sm:flex sm:items-end">
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
    </div>
  )
}
