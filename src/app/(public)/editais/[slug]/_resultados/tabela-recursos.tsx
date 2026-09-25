import { CampoValorCard } from '../campo-valor-card'
import type { RecursoPublico } from './consulta-recursos'

/** Carimbo da decisão. Sem depender de cor: o texto diz o mesmo. */
function estiloDaDecisao(decisao: string | null): string {
  if (decisao === 'DEFERIDO') return 'bg-oliva-700 text-papel-50'
  if (decisao === null) return 'bg-turquesa-700 text-papel-50'
  return 'bg-tinta-900/10 text-tinta-700'
}

const CABECALHO = 'px-4 py-3 text-xs font-bold uppercase tracking-[0.12em]'

/**
 * Os recursos como quadro afixado: número, inscrição, quem recorreu e a decisão.
 * Abaixo de `sm` a tabela vira um cartão por recurso, como na classificação.
 */
export function TabelaRecursos({ recursos }: { recursos: RecursoPublico[] }) {
  return (
    <>
      <div className="hidden overflow-x-auto border-2 border-tinta-900 bg-papel-50 sm:block">
        <table className="w-full min-w-[32rem] border-collapse text-left">
          <caption className="sr-only">Recursos interpostos e a decisão da Comissão de Seleção</caption>
          <thead>
            <tr className="border-b-2 border-tinta-900 bg-tinta-900 text-papel-50">
              <th scope="col" className={`w-14 ${CABECALHO}`}>Nº</th>
              <th scope="col" className={CABECALHO}>Inscrição</th>
              <th scope="col" className={CABECALHO}>Proponente</th>
              <th scope="col" className={CABECALHO}>CPF/CNPJ</th>
              <th scope="col" className={CABECALHO}>Decisão</th>
            </tr>
          </thead>
          <tbody>
            {recursos.map((recurso) => (
              <tr key={recurso.posicao} className="border-b border-tinta-900/15 last:border-b-0">
                <td className="px-4 py-3.5 text-lg font-bold tabular-nums text-tinta-900">{recurso.posicao}</td>
                <td className="px-4 py-3.5 font-medium tabular-nums text-tinta-900">{recurso.numero}</td>
                <td className="px-4 py-3.5 font-medium text-tinta-900">{recurso.proponente}</td>
                <td className="px-4 py-3.5 tabular-nums text-tinta-700">{recurso.cpfCnpj}</td>
                <td className="px-4 py-3.5">
                  <span className={`inline-block rounded px-2.5 py-1 text-xs font-semibold ${estiloDaDecisao(recurso.decisao)}`}>
                    {recurso.situacao}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 sm:hidden">
        {recursos.map((recurso) => (
          <CampoValorCard
            key={recurso.posicao}
            titulo={`${recurso.posicao}º · ${recurso.proponente}`}
            destaque={recurso.decisao === 'DEFERIDO'}
            pares={[
              { rotulo: 'Inscrição', valor: recurso.numero },
              { rotulo: 'CPF/CNPJ', valor: recurso.cpfCnpj },
              { rotulo: 'Decisão', valor: recurso.situacao },
            ]}
          />
        ))}
      </div>
    </>
  )
}
