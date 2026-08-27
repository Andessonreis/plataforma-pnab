import Image from 'next/image'

const SITE = 'https://cidadesinteligentes.ifba.edu.br/'
const NOME = 'Projeto Cidades Inteligentes Municípios'

/** Proporção nativa dos arquivos em public/images/marca. */
const ARTE = {
  escuro: { src: '/images/marca/logo-cidades-inteligentes-white.png', width: 649, height: 185 },
  claro: { src: '/images/marca/logo-cidades-inteligentes-color.png', width: 649, height: 185 },
} as const

interface SeloCidadesInteligentesProps {
  /**
   * Fundo sobre o qual o selo é aplicado — decide a arte.
   * `escuro` usa a versão de texto branco; `claro`, a de texto grafite.
   */
  fundo: 'claro' | 'escuro'
  /** Rótulo acima da logo. Vazio esconde a linha. */
  rotulo?: string
  /** Altura da logo. `sm` para rodapés compactos, `md` para padrão, `lg`/`xl` para destaque. */
  tamanho?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  /** Centraliza rótulo e logo — usado no bloco da home. */
  centralizado?: boolean
}

const ALTURA = {
  sm: 'h-8',
  md: 'h-10 sm:h-12',
  lg: 'h-12 sm:h-16',
  xl: 'h-14 sm:h-20',
} as const

/**
 * Crédito de desenvolvimento do portal. O Portal PNAB foi construído dentro do
 * Projeto Cidades Inteligentes Municípios (IFBA Irecê) — o selo dá a atribuição
 * e leva ao site do projeto.
 */
export function SeloCidadesInteligentes({
  fundo,
  rotulo = 'Desenvolvido por',
  tamanho = 'sm',
  className = '',
  centralizado = false,
}: SeloCidadesInteligentesProps) {
  const arte = ARTE[fundo]
  const escuro = fundo === 'escuro'

  return (
    <div className={`${centralizado ? 'flex flex-col items-center text-center' : ''} ${className}`}>
      {rotulo && (
        <p
          className={`mb-2 text-[11px] font-semibold uppercase tracking-widest ${
            escuro ? 'text-papel-200/50' : 'text-tinta-950/45'
          }`}
        >
          {rotulo}
        </p>
      )}

      <a
        href={SITE}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${NOME} — abre o site do projeto em nova aba`}
        className={`inline-flex min-h-[44px] items-center rounded-md transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 ${
          escuro ? 'focus-visible:outline-accent-300' : 'focus-visible:outline-accent-500'
        }`}
      >
        <Image
          src={arte.src}
          alt={NOME}
          width={arte.width}
          height={arte.height}
          className={`${ALTURA[tamanho]} w-auto`}
        />
      </a>
    </div>
  )
}
