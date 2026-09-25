import type { CategoriaResultado } from './agrupar-por-categoria'
import { TabelaClassificacao } from './tabela-classificacao'

interface ClassificacaoPorCategoriaProps {
  categorias: CategoriaResultado[]
  porPontuacao: boolean
}

/**
 * A classificação separada por categoria, cada uma com o próprio quadro de
 * vagas e a própria tabela.
 *
 * A lista única ordenava por posição: o 1º de cada categoria vinha junto, depois
 * os 2º, e quem procurava a sua área tinha que ler a coluna "Categoria" linha
 * a linha. Aqui cada categoria é um bloco, e o índice no topo leva direto a ele.
 */
export function ClassificacaoPorCategoria({ categorias, porPontuacao }: ClassificacaoPorCategoriaProps) {
  return (
    <>
      <nav aria-label="Categorias deste resultado" className="mb-10 border-2 border-tinta-900/15 bg-papel-50 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-tinta-700">Ir para a categoria</p>
        <ul className="mt-3 grid gap-x-8 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
          {categorias.map((categoria) => (
            <li key={categoria.ancora}>
              <a
                href={`#${categoria.ancora}`}
                className="flex min-h-[44px] items-center justify-between gap-3 text-sm font-semibold text-brand-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
              >
                <span>{categoria.nome}</span>
                <span className="text-xs font-normal tabular-nums text-tinta-600">{categoria.linhas.length}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-14">
        {categorias.map((categoria) => (
          <section key={categoria.ancora} id={categoria.ancora} aria-labelledby={`${categoria.ancora}-titulo`} className="scroll-mt-24">
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1 border-b-2 border-tinta-900 pb-2">
              <h3 id={`${categoria.ancora}-titulo`} className="titulo text-2xl leading-tight text-tinta-900">
                {categoria.nome}
              </h3>
              <p className="text-sm tabular-nums text-tinta-600">
                {categoria.linhas.length} {categoria.linhas.length === 1 ? 'proposta' : 'propostas'}
              </p>
            </div>
            {categoria.quadroDeVagas && (
              <p className="mt-2 text-sm leading-relaxed text-tinta-700">{categoria.quadroDeVagas}</p>
            )}
            <div className="mt-4">
              <TabelaClassificacao linhas={categoria.linhas} porPontuacao={porPontuacao} categoria={categoria.nome} />
            </div>
          </section>
        ))}
      </div>
    </>
  )
}
