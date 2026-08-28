import { formatDate } from '@/lib/utils/format'
import type { Retificacao } from '@/types/retificacao'

interface ConteudoProps {
  retificacao: Retificacao
  /** Quantidade de marcos do cronograma alterados — some quando é zero. */
  marcosAlterados?: number
}

/**
 * O miolo do aviso, igual nas duas casas onde ele aparece: o número do ato, o
 * que mudou, e a data em que saiu no Diário Oficial. Quem lê precisa saber que
 * o prazo mudou e conseguir conferir a fonte — o resto é moldura.
 */
function ConteudoRetificacao({ retificacao, marcosAlterados }: ConteudoProps) {
  return (
    <>
      <p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em]">
        Retificação nº {retificacao.numero}
      </p>
      <p className="mt-2 text-base leading-relaxed sm:text-lg">{retificacao.resumo}</p>
      <p className="mt-3 text-sm tabular-nums opacity-90">
        Publicada no Diário Oficial em{' '}
        <time dateTime={retificacao.publicadoEm}>{formatDate(retificacao.publicadoEm)}</time>
        {marcosAlterados
          ? ` · ${marcosAlterados} data${marcosAlterados > 1 ? 's' : ''} do cronograma alterada${marcosAlterados > 1 ? 's' : ''}`
          : null}
      </p>
      {retificacao.diarioOficialUrl && (
        <a
          href={retificacao.diarioOficialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-xs font-bold uppercase tracking-[0.14em] underline underline-offset-4"
        >
          Ver publicação no Diário Oficial
        </a>
      )}
    </>
  )
}

interface FaixaProps extends ConteudoProps {
  /** Atos anteriores, listados abaixo do vigente para o histórico ficar público. */
  anteriores?: Retificacao[]
}

/**
 * A retificação como carimbo no documento: faixa vermelha de ponta a ponta,
 * logo abaixo da capa do edital.
 *
 * Vermelho aqui não é enfeite — é a convenção de errata em publicação oficial,
 * e é o que faz alguém que já leu o edital semana passada perceber, antes de
 * rolar a página, que a data que ela anotou não vale mais. Por isso ocupa a
 * largura inteira em vez de virar um cartão no meio do texto: cartão se lê
 * como observação, faixa se lê como aviso.
 */
export function FaixaRetificacao({ retificacao, marcosAlterados, anteriores = [] }: FaixaProps) {
  return (
    <aside className="bg-red-800 text-papel-50" aria-label="Retificação do edital">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <ConteudoRetificacao retificacao={retificacao} marcosAlterados={marcosAlterados} />

        {anteriores.length > 0 && (
          <details className="mt-5 border-t border-papel-50/25 pt-4">
            <summary className="cursor-pointer text-xs font-bold uppercase tracking-[0.14em]">
              Retificações anteriores ({anteriores.length})
            </summary>
            <ul className="mt-3 space-y-2 text-sm opacity-90">
              {anteriores.map((anterior) => (
                <li key={anterior.numero}>
                  <span className="font-semibold">Nº {anterior.numero}</span>
                  <span className="px-1.5 opacity-60" aria-hidden="true">·</span>
                  <time dateTime={anterior.publicadoEm} className="tabular-nums">
                    {formatDate(anterior.publicadoEm)}
                  </time>
                  <span className="px-1.5 opacity-60" aria-hidden="true">·</span>
                  {anterior.resumo}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </aside>
  )
}

/**
 * A mesma informação dentro das telas de trabalho (área do proponente,
 * backoffice), onde não existe faixa de ponta a ponta e o conteúdo vive em
 * blocos com borda. Some a moldura, fica o aviso.
 */
export function AvisoRetificacao({ retificacao, marcosAlterados }: ConteudoProps) {
  return (
    <aside
      className="rounded-xl border border-red-300 bg-red-50 px-4 py-4 text-red-900"
      aria-label="Retificação do edital"
    >
      <ConteudoRetificacao retificacao={retificacao} marcosAlterados={marcosAlterados} />
    </aside>
  )
}
