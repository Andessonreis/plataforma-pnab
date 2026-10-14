import { maskCpfCnpj, maskName } from '@/lib/utils/mask'
import type { PropostaSuplenteItem } from './consulta'
import { CampoValorCard } from '../campo-valor-card'

interface TabelaSuplentesProps {
  propostas: PropostaSuplenteItem[]
  categoria: string
}

/**
 * Tabela e cartões mobile da convocação de suplentes, seguindo o padrão
 * visual oficial do portal e da página de habilitação documental.
 */
export function TabelaSuplentes({ propostas, categoria }: TabelaSuplentesProps) {
  return (
    <>
      {/* Tabela para Desktop (>= sm) */}
      <div className="hidden overflow-x-auto border-2 border-tinta-900 bg-papel-50 sm:block">
        <table className="w-full min-w-[36rem] border-collapse text-left">
          <caption className="sr-only">
            Relação de proponentes suplentes convocados da categoria {categoria}
          </caption>
          <thead>
            <tr className="border-b-2 border-tinta-900 bg-tinta-900 text-papel-50">
              <th scope="col" className="w-16 px-4 py-3 text-xs font-bold uppercase tracking-[0.12em]">
                Pos.
              </th>
              <th scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-[0.12em]">
                Proponente
              </th>
              <th scope="col" className="w-28 px-4 py-3 text-xs font-bold uppercase tracking-[0.12em]">
                Pontuação
              </th>
              <th scope="col" className="w-32 px-4 py-3 text-xs font-bold uppercase tracking-[0.12em]">
                Situação
              </th>
              <th scope="col" className="w-64 px-4 py-3 text-xs font-bold uppercase tracking-[0.12em]">
                Motivo / Justificativa
              </th>
            </tr>
          </thead>
          <tbody>
            {propostas.map((proposta) => {
              const convocado = proposta.convocado
              return (
                <tr
                  key={proposta.numero}
                  className={`border-b border-tinta-900/15 last:border-b-0 ${
                    convocado ? 'bg-oliva-700/10' : 'bg-terracota-700/5'
                  }`}
                >
                  <td
                    className={`px-4 py-3.5 text-lg font-bold tabular-nums text-tinta-900 ${
                      convocado ? 'border-l-4 border-l-oliva-700' : 'border-l-4 border-l-terracota-700'
                    }`}
                  >
                    {proposta.posicao}º
                  </td>
                  <td className="px-4 py-3.5 font-medium text-tinta-900">
                    <div
                      className={
                        convocado
                          ? 'font-bold underline decoration-oliva-700/60 decoration-1 underline-offset-2'
                          : 'font-semibold text-tinta-900'
                      }
                    >
                      {maskName(proposta.nome)}
                    </div>
                    <div className="text-xs font-normal text-tinta-600 tabular-nums">
                      {proposta.numero} · CPF/CNPJ: {maskCpfCnpj(proposta.cpfCnpj)}
                    </div>
                    {proposta.modalidade && (
                      <div className="text-xs font-normal text-tinta-700">
                        Concorre por: {proposta.modalidade}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-semibold tabular-nums text-tinta-900">
                    {proposta.notaFinal != null ? `${proposta.notaFinal.toFixed(2)} pts` : '—'}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-block rounded px-2.5 py-1 text-xs font-semibold ${
                        convocado ? 'bg-oliva-700 text-papel-50' : 'bg-terracota-700 text-papel-50'
                      }`}
                    >
                      {proposta.situacao}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs">
                    {convocado ? (
                      <span className="font-medium text-oliva-700">
                        {proposta.motivo ?? 'Suplente convocado para vaga remanescente'}
                      </span>
                    ) : (
                      <span className="font-medium text-terracota-700">
                        {proposta.motivo ?? 'Desclassificado'}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Cartões para Mobile (< sm) */}
      <div className="grid gap-3 sm:hidden">
        {propostas.map((proposta) => {
          const convocado = proposta.convocado
          return (
            <CampoValorCard
              key={proposta.numero}
              titulo={`${proposta.posicao}º · ${maskName(proposta.nome)}`}
              destaque={convocado}
              pares={[
                { rotulo: 'Inscrição', valor: proposta.numero },
                { rotulo: 'CPF/CNPJ', valor: maskCpfCnpj(proposta.cpfCnpj) },
                ...(proposta.modalidade ? [{ rotulo: 'Concorre por', valor: proposta.modalidade }] : []),
                {
                  rotulo: 'Pontuação',
                  valor: proposta.notaFinal != null ? `${proposta.notaFinal.toFixed(2)} pts` : '—',
                },
                {
                  rotulo: 'Situação',
                  valor: (
                    <span
                      className={`inline-block rounded px-2.5 py-0.5 text-xs font-semibold ${
                        convocado ? 'bg-oliva-700 text-papel-50' : 'bg-terracota-700 text-papel-50'
                      }`}
                    >
                      {proposta.situacao}
                    </span>
                  ),
                },
                ...(proposta.motivo
                  ? [
                      {
                        rotulo: 'Motivo / Justificativa',
                        valor: (
                          <span className={convocado ? 'text-oliva-700' : 'text-terracota-700'}>
                            {proposta.motivo}
                          </span>
                        ),
                      },
                    ]
                  : []),
              ]}
            />
          )
        })}
      </div>
    </>
  )
}
