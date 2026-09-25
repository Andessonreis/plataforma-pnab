import { Card } from '@/components/ui'
import { SeloRevisadaNoRecurso, ValorRevisado } from '@/components/avaliacao/valor-revisado'
import { brutasAnteriores, mediaAnterior, type RevisaoRecurso } from '@/lib/avaliacao/revisao-recurso'
import { FragmentBloco } from './bloco-criterios'
import { RodapeTotais } from './rodape-totais'

interface NotaItem {
  criterio: string
  nota: number
  peso: number
}

export interface AvaliacaoView {
  id: string
  nome: string
  finalizada: boolean
  notaTotal: number | null
  notas: NotaItem[]
  parecer: string | null
  data: string
  /** Valores de antes da revisão feita no julgamento do recurso, quando houve. */
  revisao: RevisaoRecurso | null
}

export interface CriterioView {
  criterio: string
  peso: number
  notaMax: number
  descricao?: string
  bloco?: string
}

interface Props {
  criterios: CriterioView[]
  avaliacoes: AvaliacaoView[]
  hasFormula: boolean
}

export function AvaliacoesComparativo({ criterios, avaliacoes, hasFormula }: Props) {
  const notaMaps = avaliacoes.map((a) => {
    const m = new Map<string, number>()
    for (const n of a.notas) m.set(n.criterio, n.nota)
    return m
  })

  const temBlocos = criterios.some((c) => c.bloco && c.bloco.trim() !== '')
  const grupos = temBlocos
    ? Array.from(
        criterios.reduce((map, c) => {
          const k = c.bloco?.trim() || 'Geral'
          if (!map.has(k)) map.set(k, [])
          map.get(k)!.push(c)
          return map
        }, new Map<string, CriterioView[]>()),
      )
    : [['', criterios] as [string, CriterioView[]]]

  // Soma direta dos critérios visíveis nesta tabela (não pondera nem aplica a
  // fórmula) — é o número em destaque pra quem está conferindo a avaliação,
  // sem precisar decorar a fórmula do edital.
  const pontuacoesBrutas = avaliacoes.map((_, i) =>
    criterios.reduce((soma, c) => soma + (notaMaps[i].get(c.criterio) ?? 0), 0),
  )

  const decimals = hasFormula ? 2 : 1

  // Valores de antes da revisão feita no julgamento do recurso — só existem nas avaliações revisadas.
  const brutasAntes = brutasAnteriores(criterios.map((c) => c.criterio), notaMaps, avaliacoes.map((a) => a.revisao))
  const revisadoEm = avaliacoes.find((a) => a.revisao)?.revisao?.revisadoEm

  // Quando o edital tem fórmula própria, a "Nota média" é a média das
  // pontuações brutas (o que a equipe realmente compara entre si), não da
  // nota já transformada pela fórmula — essa é interna de cada avaliador.
  let media: number | null = null
  if (hasFormula) {
    media =
      avaliacoes.length > 0
        ? pontuacoesBrutas.reduce((a, n) => a + n, 0) / avaliacoes.length
        : null
  } else {
    const totais = avaliacoes.map((a) => a.notaTotal).filter((n): n is number => n !== null)
    media = totais.length > 0 ? totais.reduce((a, n) => a + n, 0) / totais.length : null
  }

  const mediaAntes = mediaAnterior(
    avaliacoes.map((a, i) => ({
      pontuacao: hasFormula ? pontuacoesBrutas[i] : a.notaTotal,
      anterior: hasFormula ? brutasAntes[i] : a.revisao?.notaTotalAnterior ?? null,
    })),
  )
  const mediaMudou = mediaAntes !== null && media !== null && Math.abs(mediaAntes - media) > 0.004

  const temNotas = criterios.length > 0 && avaliacoes.some((a) => a.notas.length > 0)

  return (
    <Card padding="sm" className="sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-1 sm:mb-1.5">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900">
          Avaliações ({avaliacoes.length})
        </h2>
        {media !== null && (
          <div className="text-right">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              {hasFormula ? 'Pontuação média' : 'Nota média'}
            </p>
            <p className="text-lg font-bold text-brand-700 tabular-nums leading-none">
              {mediaMudou && mediaAntes !== null
                ? <ValorRevisado anterior={mediaAntes.toFixed(decimals)} atual={media.toFixed(decimals)} />
                : media.toFixed(decimals)}
              {hasFormula && <span className="text-xs font-semibold text-slate-400"> pts</span>}
            </p>
          </div>
        )}
      </div>

      {hasFormula && (
        <p className="text-xs text-slate-500 mb-3 sm:mb-4 leading-relaxed">
          Pontuação bruta é a soma direta dos critérios mostrados na tabela, por avaliador.
          Pontuação média é a média dessas somas entre os avaliadores — visão interna da equipe,
          não é o que aparece pro proponente nem pro público antes do resultado ser publicado.
        </p>
      )}

      {revisadoEm && (
        <p className="text-xs text-slate-500 mb-3 sm:mb-4 leading-relaxed">
          Os valores riscados são os da avaliação original. A comissão os revisou ao julgar o recurso,
          em {new Date(revisadoEm).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}.
        </p>
      )}

      {temNotas && (
        <div className="overflow-x-auto -mx-3 sm:mx-0 mb-4">
          <table className="w-full min-w-[28rem] text-sm border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-white text-left py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  Critério
                </th>
                {avaliacoes.map((a) => (
                  <th key={a.id} className="py-2.5 px-3 text-center border-b border-slate-200 min-w-[5.5rem]">
                    <span className="block text-xs font-semibold text-slate-700 leading-tight truncate max-w-[8rem] mx-auto">
                      {a.nome}
                    </span>
                    <span
                      className={[
                        'mt-1 inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                        a.finalizada ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
                      ].join(' ')}
                    >
                      {a.finalizada ? 'Finalizada' : 'Pendente'}
                    </span>
                    {a.revisao && <SeloRevisadaNoRecurso className="mt-1 block w-fit mx-auto" />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grupos.map(([bloco, items]) => (
                <FragmentBloco
                  key={bloco || 'geral'}
                  bloco={bloco}
                  items={items}
                  avaliacoes={avaliacoes}
                  notaMaps={notaMaps}
                  colSpan={avaliacoes.length + 1}
                />
              ))}
            </tbody>
            <RodapeTotais
              avaliacoes={avaliacoes}
              pontuacoesBrutas={pontuacoesBrutas}
              brutasAntes={brutasAntes}
              hasFormula={hasFormula}
              decimals={decimals}
            />
          </table>
        </div>
      )}

      {/* Pareceres individuais */}
      <div className="space-y-3">
        {avaliacoes.map((a) => (
          <div key={a.id} className="p-3 sm:p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-sm font-medium text-slate-700">{a.nome}</span>
              <span className="text-xs text-slate-400">{a.data}</span>
            </div>
            {a.parecer ? (
              <p className="text-sm text-slate-600 leading-relaxed break-words">{a.parecer}</p>
            ) : (
              <p className="text-sm text-slate-400 italic">Sem parecer registrado.</p>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}
