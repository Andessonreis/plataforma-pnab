import Link from 'next/link'

export const ABAS = [
  { chave: 'todos', label: 'Todos', href: '/editais' },
  { chave: 'abertos', label: 'Abertos', href: '/editais?status=abertos' },
  { chave: 'encerrados', label: 'Encerrados', href: '/editais?status=encerrados' },
] as const

export type ChaveAba = (typeof ABAS)[number]['chave']

interface AbasStatusProps {
  ativa: ChaveAba
  totalVisivel: number
}

/**
 * Filtro como aba de pasta, apoiada na aresta da folha de rosto.
 *
 * As abas montam sobre a faixa e descem para dentro do conteúdo, do jeito que
 * a aba de uma pasta suspensa aparece acima do documento. A aba ativa se
 * funde ao papel de baixo, sem borda inferior — é o que comunica "esta é a
 * pilha que você está vendo" sem precisar de cor de preenchimento.
 *
 * São links, não botões: o filtro está na URL, então cada aba é endereçável,
 * compartilhável e volta pelo histórico do navegador.
 */
export function AbasStatus({ ativa, totalVisivel }: AbasStatusProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-tinta-900/15">
      <nav aria-label="Filtrar editais por situação" className="flex items-end">
        {ABAS.map((aba) => {
          const selecionada = aba.chave === ativa
          return (
            <Link
              key={aba.chave}
              href={aba.href}
              aria-current={selecionada ? 'page' : undefined}
              className={`-mb-px inline-flex min-h-[44px] items-center border border-b-0 px-5 text-xs font-bold uppercase tracking-[0.14em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent-500 ${
                selecionada
                  ? 'border-tinta-900/15 bg-papel-50 pb-px text-tinta-900'
                  : 'border-transparent text-tinta-500 hover:text-brand-700'
              }`}
            >
              {aba.label}
            </Link>
          )
        })}
      </nav>

      <p className="pb-3 pr-1 text-xs uppercase tracking-[0.14em] text-tinta-500">
        {totalVisivel} {totalVisivel === 1 ? 'edital' : 'editais'}
      </p>
    </div>
  )
}
