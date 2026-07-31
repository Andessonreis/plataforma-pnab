import Link from 'next/link'
import { IconArrowRight, IconDownload } from '@/components/ui/icons'
import { Cartela } from '@/components/ui/cartela'
import { getCronogramaItemStatus } from '@/lib/utils/cronograma'
import { formatDateTime } from '@/lib/utils/format'
import { isAcaoPublicacao } from '@/types/cronograma'
import type { CronogramaDisplayItem } from '@/types/cronograma'
import { RecursoEditalButton } from './recurso-edital-button'

interface CronogramaEditalProps {
  itens: CronogramaDisplayItem[]
  slug: string
  agora: Date
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/** Dia e mês do marco, no formato da caixa de data do impresso. */
function caixaDeData(iso: string): { dia: string; mes: string } | null {
  const data = new Date(iso.includes('T') ? iso : `${iso}T00:00:00`)
  if (Number.isNaN(data.getTime())) return null
  return { dia: String(data.getDate()).padStart(2, '0'), mes: MESES[data.getMonth()] }
}

/**
 * Cronograma como pauta do edital, com a data em caixa à esquerda.
 *
 * A versão anterior era uma lista com bolinha e a data espremida à direita do
 * rótulo, em corpo pequeno. Num edital, a data é o que a pessoa procura — ela
 * volta a esta página para saber quando abre, quando fecha e quando sai o
 * resultado. Aqui a data ocupa a coluna da esquerda, alinhada entre todos os
 * marcos, e o que já passou perde peso em vez de sumir.
 *
 * Os marcos que geram publicação (listas, resultados, janela de recurso)
 * continuam levando aos seus destinos: é neles que o cronograma deixa de ser
 * informação e vira caminho.
 */
export function CronogramaEdital({ itens, slug, agora }: CronogramaEditalProps) {
  if (itens.length === 0) return null

  return (
    <section>
      <Cartela id="cronograma" cor="oliva">Cronograma</Cartela>

      <ol className="mt-6 divide-y divide-tinta-900/15 border-y border-tinta-900/15">
        {itens.map((item, indice) => {
          const situacao = getCronogramaItemStatus(itens, indice, agora)
          const cumprido = situacao === 'past'
          const emCurso = situacao === 'current'
          const data = caixaDeData(item.dataHora)

          return (
            <li
              key={`${item.label}-${indice}`}
              className={`flex gap-5 py-5 ${cumprido ? 'opacity-55' : ''} ${
                emCurso ? 'bg-accent-500/10' : ''
              }`}
            >
              {data && (
                <p
                  className={`caixa-data shrink-0 self-start ${
                    emCurso ? 'text-accent-700' : cumprido ? 'text-tinta-400' : 'text-brand-700'
                  }`}
                  aria-hidden="true"
                >
                  <span className="font-rye text-xl">{data.dia}</span>
                  <span className="mt-1 text-[0.625rem] font-bold uppercase tracking-[0.14em]">
                    {data.mes}
                  </span>
                </p>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3
                    className={`font-rye text-lg leading-snug tracking-wide ${
                      cumprido ? 'text-tinta-600' : 'text-tinta-900'
                    }`}
                  >
                    {item.label}
                  </h3>
                  {emCurso && (
                    <span className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-accent-700">
                      Em andamento
                    </span>
                  )}
                  {cumprido && (
                    <span className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-tinta-500">
                      Cumprido
                    </span>
                  )}
                </div>

                <p className="mt-1 text-sm tabular-nums text-tinta-600">
                  <time dateTime={item.dataHora}>{formatDateTime(item.dataHora)}</time>
                  {item.fimEm && (
                    <>
                      <span className="px-2 text-tinta-400" aria-hidden="true">
                        até
                      </span>
                      <time dateTime={item.fimEm}>{formatDateTime(item.fimEm)}</time>
                    </>
                  )}
                </p>

                {(cumprido || emCurso) && (
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                    {isAcaoPublicacao(item.acao) && (
                      <>
                        <Link
                          href={`/editais/${slug}/publicacoes/${item.acao}`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-brand-700 underline-offset-4 hover:underline"
                        >
                          Ver lista
                          <IconArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </Link>
                        <a
                          href={`/api/editais/${slug}/publicacoes/${item.acao}?format=csv`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-brand-700 underline-offset-4 hover:underline"
                        >
                          <IconDownload className="h-3.5 w-3.5" aria-hidden="true" />
                          Baixar CSV
                        </a>
                      </>
                    )}

                    {(item.fase === 'RESULTADO_PRELIMINAR' || item.fase === 'RESULTADO_FINAL') && (
                      <Link
                        href={`/editais/${slug}/resultados`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-brand-700 underline-offset-4 hover:underline"
                      >
                        Ver resultados
                        <IconArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    )}

                    {emCurso && item.acao === 'RECURSO_EDITAL_JANELA' && (
                      <RecursoEditalButton slug={slug} />
                    )}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
