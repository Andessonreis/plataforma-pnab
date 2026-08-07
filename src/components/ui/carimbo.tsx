/**
 * Tons do carimbo, tirados dos conceitos que a identidade SECULT atribui a
 * cada cor: oliva é safra e esperança (o que deu certo ou está aberto), âmbar
 * é vitalidade (o que está em curso), turquesa é prestação e acolhimento,
 * tinta é o registro arquivado.
 */
import Link from 'next/link'

export type TomCarimbo = 'safra' | 'curso' | 'prestacao' | 'arquivo'

interface CarimboProps {
  tom: TomCarimbo
  children: React.ReactNode
  /** Superfície onde o carimbo é aplicado. Sobre tinta, o traço clareia. */
  sobre?: 'papel' | 'tinta'
  className?: string
  /** Torna o carimbo um link — usado como controle de filtro por situação. */
  href?: string
  /** Estado do filtro quando `href` está presente: preenchido em vez de contornado. */
  selecionado?: boolean
}

const TONS: Record<'papel' | 'tinta', Record<TomCarimbo, string>> = {
  papel: {
    safra: 'border-oliva-700 bg-oliva-700/10 text-oliva-800',
    curso: 'border-accent-600 bg-accent-500/10 text-accent-800',
    prestacao: 'border-turquesa-700 bg-turquesa-600/10 text-turquesa-800',
    arquivo: 'border-tinta-400 bg-tinta-900/5 text-tinta-600',
  },
  // Os mesmos conceitos, com os stops claros da escala: em tinta, o carimbo
  // escuro do papel some no fundo.
  tinta: {
    safra: 'border-oliva-300 bg-oliva-300/10 text-oliva-100',
    curso: 'border-accent-400 bg-accent-400/10 text-accent-200',
    prestacao: 'border-turquesa-300 bg-turquesa-300/10 text-turquesa-100',
    arquivo: 'border-papel-200/60 bg-papel-100/10 text-papel-200',
  },
}

/** Variante preenchida, para o carimbo selecionado quando usado como filtro. */
const TONS_SELECIONADO: Record<TomCarimbo, string> = {
  safra: 'border-oliva-700 bg-oliva-700 text-papel-50',
  curso: 'border-accent-600 bg-accent-600 text-tinta-950',
  prestacao: 'border-turquesa-700 bg-turquesa-700 text-papel-50',
  arquivo: 'border-tinta-600 bg-tinta-600 text-papel-50',
}

/**
 * Situação como carimbo, não como pílula colorida.
 *
 * Documento oficial recebe carimbo, e é assim que a Secretaria comunica em
 * suas peças: canto vivo, contorno grosso, caixa alta espaçada e batido
 * levemente torto. A inclinação é o que separa a leitura de "marca aplicada
 * sobre o papel" da de "componente de interface".
 *
 * Fica em `ui` porque editais e projetos apoiados carimbam a mesma coisa —
 * em que ponto do processo aquele documento está.
 */
export function Carimbo({ tom, children, sobre = 'papel', className = '', href, selecionado = false }: CarimboProps) {
  const base = '-rotate-[1.5deg] border-2 text-[0.6875rem] font-bold uppercase leading-none tracking-[0.16em]'

  if (href) {
    return (
      <Link
        href={href}
        aria-current={selecionado ? 'true' : undefined}
        className={`inline-flex min-h-[44px] items-center px-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 ${base} ${
          selecionado ? TONS_SELECIONADO[tom] : `${TONS[sobre][tom]} hover:opacity-80`
        } ${className}`}
      >
        {children}
      </Link>
    )
  }

  return (
    <span className={`inline-block px-2.5 py-1 ${base} ${TONS[sobre][tom]} ${className}`}>
      {children}
    </span>
  )
}
