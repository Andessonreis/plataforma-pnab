import { formatDateTime } from '@/lib/utils/format'
import type { CronogramaDisplayItem } from '@/types/cronograma'

interface Props {
  item: CronogramaDisplayItem
  /** Sobre faixa de cor: o risco e o texto precisam clarear para continuar legíveis. */
  escuro?: boolean
}

/**
 * A data de um marco do cronograma — e, quando houve retificação, também a
 * data que ela substituiu.
 *
 * Trocar a data em silêncio seria o pior desfecho para quem já tinha anotado o
 * prazo: a pessoa volta à página, vê uma data diferente da que lembrava e não
 * sabe se errou a anotação ou se o edital mudou. O valor antigo fica visível e
 * riscado, com o número do ato ao lado, que é como uma errata se lê no papel —
 * "onde se lê 27/08, leia-se 02/09".
 */
export function LinhaDatasMarco({ item, escuro = false }: Props) {
  const corData = escuro ? 'text-papel-200/80' : 'text-tinta-600'
  const corRisco = escuro ? 'text-papel-200/55' : 'text-tinta-500'
  const corMarca = escuro ? 'text-red-300' : 'text-red-700'
  const anterior = item.retificado

  return (
    <>
      <p className={`mt-1 text-sm tabular-nums ${corData}`}>
        <time dateTime={item.dataHora}>{formatDateTime(item.dataHora)}</time>
        {item.fimEm && (
          <>
            <span className="px-2 opacity-60" aria-hidden="true">
              até
            </span>
            <time dateTime={item.fimEm}>{formatDateTime(item.fimEm)}</time>
          </>
        )}
      </p>

      {anterior && (
        <p className={`mt-1 text-xs tabular-nums ${corRisco}`}>
          <span className={`font-bold uppercase tracking-[0.14em] ${corMarca}`}>
            Retificado nº {anterior.retificacaoNumero}
          </span>
          <span className="px-2 opacity-60" aria-hidden="true">
            ·
          </span>
          <span className="sr-only">Data anterior, sem validade: </span>
          <s>
            <time dateTime={anterior.dataHoraAnterior}>
              {formatDateTime(anterior.dataHoraAnterior)}
            </time>
            {anterior.fimEmAnterior && (
              <>
                <span className="px-2" aria-hidden="true">
                  até
                </span>
                <time dateTime={anterior.fimEmAnterior}>
                  {formatDateTime(anterior.fimEmAnterior)}
                </time>
              </>
            )}
          </s>
        </p>
      )}
    </>
  )
}
