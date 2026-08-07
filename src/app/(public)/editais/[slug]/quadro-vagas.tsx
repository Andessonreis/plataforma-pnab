import { formatCurrency } from '@/lib/utils/format'
import type { CategoriaConfig } from '@/types/categoria-config'
import { CampoValorCard } from './campo-valor-card'

interface QuadroVagasProps {
  categorias: CategoriaConfig[]
  /** União das cotas de todas as categorias, na ordem de primeira aparição. */
  cotas: string[]
}

/**
 * Quadro de vagas e valores por categoria.
 *
 * Em telas largas continua tabela, e de propósito: são números comparáveis
 * entre linhas e colunas, e é para isso que a tabela existe. Abaixo de `sm`
 * ela não cabe sem rolagem forçada — o número de colunas varia com a
 * quantidade de cotas do edital — então os mesmos dados reaparecem como um
 * cartão por categoria, sem perder nenhum campo.
 */
export function QuadroVagas({ categorias, cotas }: QuadroVagasProps) {
  if (categorias.length === 0) return null

  return (
    <>
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[36rem] text-sm">
          <caption className="sr-only">
            Vagas por categoria, cotas, valor por projeto e valor total de cada categoria
          </caption>
          <thead>
            <tr className="border-y-2 border-tinta-900 text-left">
              <th scope="col" className="py-3 pr-4 text-xs font-bold uppercase tracking-[0.14em] text-tinta-600">
                Categoria
              </th>
              <th scope="col" className="py-3 pr-4 text-xs font-bold uppercase tracking-[0.14em] text-tinta-600">
                Ampla concorrência
              </th>
              {cotas.map((cota) => (
                <th
                  key={cota}
                  scope="col"
                  className="py-3 pr-4 text-xs font-bold uppercase tracking-[0.14em] text-tinta-600"
                >
                  {cota}
                </th>
              ))}
              <th scope="col" className="py-3 pr-4 text-right text-xs font-bold uppercase tracking-[0.14em] text-tinta-600">
                Por projeto
              </th>
              <th scope="col" className="py-3 text-right text-xs font-bold uppercase tracking-[0.14em] text-tinta-600">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-tinta-900/15">
            {categorias.map((categoria) => (
              <tr key={categoria.nome}>
                <th scope="row" className="py-3 pr-4 text-left titulo text-base font-normal tracking-wide text-tinta-900">
                  {categoria.nome}
                </th>
                <td className="py-3 pr-4 tabular-nums text-tinta-700">
                  {categoria.vagasAmplaConcorrencia ?? '—'}
                </td>
                {cotas.map((cota) => (
                  <td key={cota} className="py-3 pr-4 tabular-nums text-tinta-700">
                    {categoria.cotas.find((c) => c.label === cota)?.vagas ?? '—'}
                  </td>
                ))}
                <td className="py-3 pr-4 text-right tabular-nums text-tinta-700">
                  {categoria.valorPorProjeto != null ? formatCurrency(categoria.valorPorProjeto) : '—'}
                </td>
                <td className="py-3 text-right titulo text-base text-brand-700">
                  {formatCurrency(categoria.valorTotalCategoria)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 sm:hidden">
        {categorias.map((categoria) => (
          <CampoValorCard
            key={categoria.nome}
            titulo={categoria.nome}
            pares={[
              { rotulo: 'Ampla concorrência', valor: categoria.vagasAmplaConcorrencia ?? '—' },
              ...cotas.map((cota) => ({
                rotulo: cota,
                valor: categoria.cotas.find((c) => c.label === cota)?.vagas ?? '—',
              })),
              {
                rotulo: 'Por projeto',
                valor:
                  categoria.valorPorProjeto != null ? formatCurrency(categoria.valorPorProjeto) : '—',
              },
              { rotulo: 'Total da categoria', valor: formatCurrency(categoria.valorTotalCategoria) },
            ]}
          />
        ))}
      </div>
    </>
  )
}
