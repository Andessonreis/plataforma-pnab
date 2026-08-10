import { statusDia, type GaleriaItem } from '@/lib/utils/noticia-galeria'

interface GaleriaProgramacaoProps {
  itens: GaleriaItem[]
}

function formatarDataCurta(data: string): string {
  // `data` é `YYYY-MM-DD` puro — construir com partes evita o fuso do
  // navegador jogar a data pro dia anterior (`new Date('2026-08-09')` é UTC).
  const [ano, mes, dia] = data.split('-').map(Number)
  const local = new Date(ano, mes - 1, dia)
  return local
    .toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
    .replace('.', '')
}

const ESTILO_STATUS: Record<'hoje' | 'passado' | 'futuro', string> = {
  hoje: 'ring-2 ring-accent-500 ring-offset-2 ring-offset-papel-100',
  passado: 'opacity-60 grayscale-[0.4]',
  futuro: '',
}

/**
 * Programação em cards, um por dia/atração — pensada para cobertura de
 * eventos de vários dias (festivais, mostras). O card do dia atual ganha
 * destaque visual (`statusDia`); os já encerrados ficam esmaecidos, sem
 * sumir — quem chega no meio do evento ainda vê o que já rolou.
 *
 * Cards com pôster/arte própria (retrato) usam recorte no topo em vez do
 * `object-cover` central: o miolo dessas artes costuma ser o rodapé de
 * patrocínio, não a foto que importa.
 */
export function GaleriaProgramacao({ itens }: GaleriaProgramacaoProps) {
  if (itens.length === 0) return null

  return (
    <section aria-label="Programação" className="border-b-2 border-tinta-900 bg-papel-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <p className="rotulo text-xs text-brand-700">Confira a programação</p>
        <ul className="scrollbar-hide mt-4 flex gap-4 overflow-x-auto pb-2">
          {itens.map((item, i) => {
            const status = statusDia(item.data)
            return (
              <li
                key={`${item.url}-${i}`}
                className={`w-40 shrink-0 sm:w-48 ${status ? ESTILO_STATUS[status] : ''}`}
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-sm bg-tinta-900/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.legenda}
                    loading="lazy"
                    className="h-full w-full object-cover object-top"
                  />
                  {status === 'hoje' && (
                    <span className="absolute left-2 top-2 rounded-sm bg-accent-500 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.1em] text-tinta-950">
                      Hoje
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm font-bold leading-tight text-tinta-900">{item.legenda}</p>
                {item.data && (
                  <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-tinta-500">
                    {formatarDataCurta(item.data)}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
