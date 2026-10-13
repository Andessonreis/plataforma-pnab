import Link from 'next/link'
import { formatDate, parseBrazilDateTime } from '@/lib/utils/format'
import { CaixaData } from './caixa-data'
import { contagemRegressiva, diaEMes, type UpcomingDeadline } from './prazos'
import { SecaoPainel } from './secao-painel'

/** Lista de encerramentos que vêm a seguir; cada um abre o edital correspondente. */
export function PrazosLista({ prazos }: { prazos: UpcomingDeadline[] }) {
  if (prazos.length === 0) return null

  return (
    <SecaoPainel id="tour-prazos" titulo="Próximos prazos">
      <ul>
        {prazos.map((prazo) => {
          const { dia, mes } = diaEMes(parseBrazilDateTime(prazo.dataHora), 'America/Sao_Paulo')
          return (
            <li key={`${prazo.editalId}-${prazo.label}`} className="border-b border-tinta-900/15 last:border-b-0">
              <Link
                href={`/editais/${prazo.slug}`}
                className="flex min-h-[64px] items-center gap-4 py-3 text-tinta-900 [@media(hover:hover)]:hover:bg-white/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta-900"
              >
                <CaixaData dia={dia} mes={mes} className="text-brand-700" />
                <span className="min-w-0">
                  <span className="block font-semibold leading-snug">{prazo.label}</span>
                  <span className="block truncate text-sm text-tinta-700">{prazo.editalTitulo}</span>
                  <span className="block text-sm font-semibold text-brand-700">
                    {contagemRegressiva(prazo.dataHora)}, {formatDate(prazo.dataHora)}
                  </span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </SecaoPainel>
  )
}
