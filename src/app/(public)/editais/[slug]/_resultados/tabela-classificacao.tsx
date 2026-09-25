import { CampoValorCard } from '../campo-valor-card'
import type { LinhaResultadoPublico, SituacaoClassificada } from '@/lib/results/resultado-publico'

interface TabelaClassificacaoProps {
  linhas: LinhaResultadoPublico[]
  porPontuacao: boolean
  /** Categoria da tabela, lida pelo leitor de tela como legenda. */
  categoria: string
}

const ROTULO_SITUACAO: Record<SituacaoClassificada, string> = {
  RESULTADO_PRELIMINAR: 'Classificado',
  RESULTADO_FINAL: 'Classificado',
  CONTEMPLADA: 'Classificado',
  NAO_CONTEMPLADA: 'Desclassificado',
  SUPLENTE: 'Suplente',
  RECURSO_ABERTO: 'Em recurso',
}

/** Carimbo por situação. Sem depender de cor: o rótulo diz o mesmo. */
const CARIMBO_SITUACAO: Record<SituacaoClassificada, string> = {
  RESULTADO_PRELIMINAR: 'bg-oliva-700 text-papel-50',
  RESULTADO_FINAL: 'bg-oliva-700 text-papel-50',
  CONTEMPLADA: 'bg-oliva-700 text-papel-50',
  NAO_CONTEMPLADA: 'bg-tinta-900/10 text-tinta-700',
  SUPLENTE: 'bg-accent-500 text-tinta-950',
  RECURSO_ABERTO: 'bg-turquesa-700 text-papel-50',
}

function resolverSituacao(linha: LinhaResultadoPublico): { rotulo: string; estilo: string } {
  if (linha.nota === null && linha.posicao === null) {
    return {
      rotulo: 'Não se aplica',
      estilo: 'bg-tinta-900/10 text-tinta-700',
    }
  }
  return {
    rotulo: ROTULO_SITUACAO[linha.situacao] ?? linha.situacao,
    estilo: CARIMBO_SITUACAO[linha.situacao] ?? 'bg-tinta-900/10 text-tinta-700',
  }
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
export function TabelaClassificacao({ linhas, porPontuacao, categoria }: TabelaClassificacaoProps) {
  return (
    <>
    <div className="hidden overflow-x-auto border-2 border-tinta-900 bg-papel-50 sm:block">
      <table className="w-full min-w-[32rem] border-collapse text-left">
        <caption className="sr-only">
          Classificação da categoria {categoria}, da maior para a menor pontuação
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
            const { rotulo, estilo } = resolverSituacao(linha)
            return (
              <tr
                key={linha.numero}
                className={`border-b border-tinta-900/15 last:border-b-0 ${
                  contemplada ? 'bg-oliva-700/10' : ''
                }`}
              >
                <td
                  className={`px-4 py-3.5 text-lg font-bold tabular-nums text-tinta-900 ${
                    contemplada ? 'border-l-4 border-l-oliva-700' : 'border-l-4 border-l-transparent'
                  }`}
                >
                  {linha.posicao != null ? `${linha.posicao}º` : '—'}
                </td>
                <td className="px-4 py-3.5 font-medium text-tinta-900">
                  <div className={contemplada ? 'font-bold underline decoration-oliva-700/60 decoration-1 underline-offset-2' : ''}>
                    {linha.proponente}
                  </div>
                  <div className="text-xs font-normal text-tinta-600 tabular-nums">
                    {linha.numero}
                  </div>
                </td>
                <td className="px-4 py-3.5 font-semibold tabular-nums text-tinta-900">
                  {linha.nota ? `${linha.nota}${porPontuacao ? ' pts' : ''}` : '—'}
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-block rounded px-2.5 py-1 text-xs font-semibold ${estilo}`}
                  >
                    {rotulo}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>

    <div className="grid gap-3 sm:hidden">
      {linhas.map((linha) => {
        const contemplada = linha.situacao === 'CONTEMPLADA'
        const { rotulo } = resolverSituacao(linha)
        return (
          <CampoValorCard
            key={linha.numero}
            titulo={linha.posicao != null ? `${linha.posicao}º · ${linha.proponente}` : linha.proponente}
            destaque={contemplada}
            pares={[
              { rotulo: 'Inscrição', valor: linha.numero },
              {
                rotulo: porPontuacao ? 'Pontuação' : 'Nota',
                valor: linha.nota ? `${linha.nota}${porPontuacao ? ' pts' : ''}` : '—',
              },
              { rotulo: 'Situação', valor: rotulo },
            ]}
          />
        )
      })}
    </div>
    </>
  )
}
