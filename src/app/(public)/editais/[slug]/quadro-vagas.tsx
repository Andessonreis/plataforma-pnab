import { Cartela } from '@/components/ui/cartela'
import { formatCurrency } from '@/lib/utils/format'
import type { CategoriaConfig } from '@/types/categoria-config'

interface QuadroVagasProps {
  categorias: CategoriaConfig[]
  /** União das cotas de todas as categorias, na ordem de primeira aparição. */
  cotas: string[]
}

/**
 * Quadro de vagas e valores por categoria.
 *
 * Continua sendo tabela, e de propósito: são números comparáveis entre linhas
 * e colunas, e é para isso que a tabela existe — trocá-la por cartões
 * quebraria a comparação, que é a única razão de a pessoa olhar este quadro.
 *
 * O que muda é o tratamento: fios finos no lugar da moldura de cartão, valores
 * alinhados à direita e em corpo tabular, e a categoria como cabeçalho de
 * linha (`th scope="row"`), que é o que faz um leitor de tela anunciar a
 * categoria ao ler cada célula.
 */
export function QuadroVagas({ categorias, cotas }: QuadroVagasProps) {
  if (categorias.length === 0) return null

  return (
    <section>
      <Cartela id="vagas" cor="terracota">Vagas e valores</Cartela>

      <div className="mt-6 overflow-x-auto">
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
                <th scope="row" className="py-3 pr-4 text-left font-rye text-base font-normal tracking-wide text-tinta-900">
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
                <td className="py-3 text-right font-rye text-base text-brand-700">
                  {formatCurrency(categoria.valorTotalCategoria)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
