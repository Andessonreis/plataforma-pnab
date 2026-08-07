import { CampoValorCard } from '../campo-valor-card'
import type { LinhaClassificacao, SituacaoClassificada } from './consulta'

interface TabelaClassificacaoProps {
  linhas: LinhaClassificacao[]
  porPontuacao: boolean
}

const ROTULO_SITUACAO: Record<SituacaoClassificada, string> = {
  RESULTADO_PRELIMINAR: 'Classificada',
  RESULTADO_FINAL: 'Classificada',
  CONTEMPLADA: 'Contemplada',
  NAO_CONTEMPLADA: 'Não contemplada',
  SUPLENTE: 'Suplente',
  RECURSO_ABERTO: 'Em recurso',
}

/** Carimbo por situação. Sem depender de cor: o rótulo diz o mesmo. */
const CARIMBO_SITUACAO: Record<SituacaoClassificada, string> = {
  RESULTADO_PRELIMINAR: 'bg-tinta-900/10 text-tinta-800',
  RESULTADO_FINAL: 'bg-tinta-900/10 text-tinta-800',
  CONTEMPLADA: 'bg-oliva-700 text-papel-50',
  NAO_CONTEMPLADA: 'bg-tinta-900/10 text-tinta-700',
  SUPLENTE: 'bg-accent-500 text-tinta-950',
  RECURSO_ABERTO: 'bg-turquesa-700 text-papel-50',
}

/**
 * A classificação como quadro de resultado afixado, não como tabela de sistema.
 *
 * O contemplado é destacado pela faixa de tinta na lateral e pela posição em
 * corpo grande — quem abre esta página está procurando um nome ou uma posição,
 * e as duas coisas precisam ser encontráveis sem ler a linha inteira.
 *
 * Abaixo de `sm` a tabela não cabe sem rolagem forçada, e a ordem das
 * colunas (posição, quem, quanto) é justamente a leitura que se perderia
 * num scroll escondido — por isso vira um cartão por proposta, com a
 * mesma marcação de contemplada na borda.
 */
export function TabelaClassificacao({ linhas, porPontuacao }: TabelaClassificacaoProps) {
  return (
    <>
    <div className="hidden overflow-x-auto border-2 border-tinta-900 bg-papel-50 sm:block">
      <table className="w-full min-w-[38rem] border-collapse text-left">
        <caption className="sr-only">
          Classificação das propostas, da maior para a menor pontuação
        </caption>
        <thead>
          <tr className="border-b-2 border-tinta-900 bg-tinta-900 text-papel-50">
            <th scope="col" className="w-16 px-4 py-3 text-xs font-bold uppercase tracking-[0.12em]">
              Pos.
            </th>
            <th scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-[0.12em]">
              Proponente
            </th>
            <th scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-[0.12em]">
              Categoria
            </th>
            <th scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-[0.12em]">
              {porPontuacao ? 'Pontuação' : 'Nota'}
            </th>
            <th scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-[0.12em]">
              Situação
            </th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha) => {
            const contemplada = linha.situacao === 'CONTEMPLADA'
            return (
              <tr
                key={linha.id}
                className={`border-b border-tinta-900/15 last:border-b-0 ${
                  contemplada ? 'bg-oliva-700/10' : ''
                }`}
              >
                <td
                  className={`px-4 py-3.5 text-lg font-bold tabular-nums text-tinta-900 ${
                    contemplada ? 'border-l-4 border-l-oliva-700' : 'border-l-4 border-l-transparent'
                  }`}
                >
                  {linha.posicao}
                </td>
                <td className="px-4 py-3.5 font-medium text-tinta-900">{linha.proponente}</td>
                <td className="px-4 py-3.5 text-sm text-tinta-700">{linha.categoria ?? '—'}</td>
                <td className="px-4 py-3.5 font-semibold tabular-nums text-tinta-900">
                  {linha.nota ? `${linha.nota}${porPontuacao ? ' pts' : ''}` : '—'}
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-block px-2.5 py-1 text-xs font-bold uppercase tracking-[0.1em] ${CARIMBO_SITUACAO[linha.situacao]}`}
                  >
                    {ROTULO_SITUACAO[linha.situacao]}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>

    <div className="grid gap-3 sm:hidden">
      {linhas.map((linha) => (
        <CampoValorCard
          key={linha.id}
          titulo={`${linha.posicao}º · ${linha.proponente}`}
          destaque={linha.situacao === 'CONTEMPLADA'}
          pares={[
            { rotulo: 'Categoria', valor: linha.categoria ?? '—' },
            {
              rotulo: porPontuacao ? 'Pontuação' : 'Nota',
              valor: linha.nota ? `${linha.nota}${porPontuacao ? ' pts' : ''}` : '—',
            },
            { rotulo: 'Situação', valor: ROTULO_SITUACAO[linha.situacao] },
          ]}
        />
      ))}
    </div>
    </>
  )
}
