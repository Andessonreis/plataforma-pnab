import Link from 'next/link'

export interface AbaFiltro {
  chave: string
  label: string
  href: string
}

interface AbasFiltroProps {
  abas: readonly AbaFiltro[]
  ativa: string
  /** Descreve o critério para leitor de tela, ex.: "Filtrar editais por situação". */
  rotulo: string
}

/**
 * Filtro como aba de pasta, apoiada na aresta da seção acima.
 *
 * As abas montam sobre a faixa e descem para dentro do conteúdo, do jeito que
 * a aba de uma pasta suspensa aparece acima do documento. A ativa se funde ao
 * papel de baixo, sem borda inferior — é o que comunica "esta é a pilha que
 * você está vendo" sem precisar de cor de preenchimento.
 *
 * São links, não botões: o filtro está na URL, então cada aba é endereçável,
 * compartilhável e volta pelo histórico do navegador.
 */
export function AbasFiltro({ abas, ativa, rotulo }: AbasFiltroProps) {
  return (
    <nav
      aria-label={rotulo}
      className="flex flex-wrap items-end border-b border-tinta-900/15"
    >
      {abas.map((aba) => {
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
  )
}
