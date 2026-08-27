import Link from 'next/link'
import { IconArrowRight, IconDownload } from '@/components/ui/icons'
import { getCronogramaItemStatus } from '@/lib/utils/cronograma'
import { isAcaoPublicacao } from '@/types/cronograma'
import type { CronogramaDisplayItem } from '@/types/cronograma'
import { LinhaDatasMarco } from './linha-datas-marco'
import { RecursoEditalButton } from './recurso-edital-button'

interface CronogramaEditalProps {
  itens: CronogramaDisplayItem[]
  slug: string
  agora: Date
  /** Sobre faixa de cor: fios e texto clareiam. */
  escuro?: boolean
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
export function CronogramaEdital({ itens, slug, agora, escuro = false }: CronogramaEditalProps) {
  if (itens.length === 0) return null

  const fio = escuro ? 'divide-papel-100/20 border-papel-100/20' : 'divide-tinta-900/15 border-tinta-900/15'
  const corTitulo = escuro ? 'text-papel-50' : 'text-tinta-900'
  const corAcao = escuro ? 'text-accent-300' : 'text-brand-700'

  return (
    <ol className={`divide-y border-y ${fio}`}>
        {itens.map((item, indice) => {
          const situacao = getCronogramaItemStatus(itens, indice, agora)
          const cumprido = situacao === 'past'
          const emCurso = situacao === 'current'
          const data = caixaDeData(item.dataHora)

          return (
            <li
              key={`${item.label}-${indice}`}
              className={`flex gap-5 py-5 ${cumprido ? 'opacity-50' : ''} ${
                emCurso ? (escuro ? 'bg-accent-400/15' : 'bg-accent-500/15') : ''
              }`}
            >
              {data && (
                <p
                  className={`caixa-data shrink-0 self-start ${
                    emCurso
                      ? escuro ? 'text-accent-300' : 'text-accent-700'
                      : escuro ? 'text-papel-200' : 'text-brand-700'
                  }`}
                  aria-hidden="true"
                >
                  <span className="titulo text-xl">{data.dia}</span>
                  <span className="mt-1 text-[0.625rem] font-bold uppercase tracking-[0.14em]">
                    {data.mes}
                  </span>
                </p>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3
                    className={`titulo text-lg leading-snug tracking-wide ${corTitulo}`}
                  >
                    {item.label}
                  </h3>
                  {emCurso && (
                    <span className={`text-[0.6875rem] font-bold uppercase tracking-[0.16em] ${escuro ? 'text-accent-300' : 'text-accent-700'}`}>
                      Em andamento
                    </span>
                  )}
                  {cumprido && (
                    <span className={`text-[0.6875rem] font-bold uppercase tracking-[0.16em] ${escuro ? 'text-papel-200/70' : 'text-tinta-500'}`}>
                      Cumprido
                    </span>
                  )}
                </div>

                <LinhaDatasMarco item={item} escuro={escuro} />

                {(cumprido || emCurso) && (
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                    {isAcaoPublicacao(item.acao) && (
                      <>
                        <Link
                          href={`/editais/${slug}/publicacoes/${item.acao}`}
                          className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] ${corAcao} underline-offset-4 hover:underline`}
                        >
                          Ver lista
                          <IconArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </Link>
                        <a
                          href={`/api/editais/${slug}/publicacoes/${item.acao}?format=csv`}
                          className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] ${corAcao} underline-offset-4 hover:underline`}
                        >
                          <IconDownload className="h-3.5 w-3.5" aria-hidden="true" />
                          Baixar CSV
                        </a>
                      </>
                    )}

                    {(item.fase === 'RESULTADO_PRELIMINAR' || item.fase === 'RESULTADO_FINAL') && (
                      <Link
                        href={`/editais/${slug}/resultados`}
                        className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] ${corAcao} underline-offset-4 hover:underline`}
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
  )
}
