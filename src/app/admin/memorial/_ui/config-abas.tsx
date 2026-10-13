import Link from 'next/link'

/**
 * Abas do Memorial: sublinhado dourado na ativa, igual às abas do restante do painel.
 * `AbasLink` troca de página (filtro na URL); `AbasBotao` troca o que aparece na mesma tela.
 */

interface Aba {
  chave: string
  rotulo: string
  /** Número ao lado do nome, quando ajuda a decidir para onde ir. */
  contagem?: number
}

const trilho = 'flex gap-1 overflow-x-auto border-b border-tinta-900/10'
const item =
  'relative -mb-px inline-flex min-h-[44px] shrink-0 items-center gap-2 border-b-[3px] px-4 text-sm font-semibold transition-colors ' +
  'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-500'
const ativa = 'border-accent-500 text-tinta-900'
const inativa = 'border-transparent text-tinta-600 hover:border-tinta-900/20 hover:text-tinta-900'

function Contagem({ n, destaque }: { n: number; destaque: boolean }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${destaque ? 'bg-accent-100 text-accent-900' : 'bg-papel-100 text-tinta-700'}`}>
      {n}
    </span>
  )
}

export function AbasLink({ abas, ativa: chaveAtiva, rotulo }: { abas: (Aba & { href: string })[]; ativa: string; rotulo: string }) {
  return (
    <nav aria-label={rotulo} className={trilho}>
      {abas.map((a) => {
        const atual = a.chave === chaveAtiva
        return (
          <Link key={a.chave} href={a.href} aria-current={atual ? 'page' : undefined} className={`${item} ${atual ? ativa : inativa}`}>
            {a.rotulo}
            {a.contagem !== undefined && <Contagem n={a.contagem} destaque={atual} />}
          </Link>
        )
      })}
    </nav>
  )
}

interface AbasBotaoProps {
  abas: Aba[]
  ativa: string
  rotulo: string
  onChange: (chave: string) => void
  className?: string
}

/** Só para componentes de cliente: recebe o `onChange`. */
export function AbasBotao({ abas, ativa: chaveAtiva, rotulo, onChange, className = '' }: AbasBotaoProps) {
  return (
    <div role="tablist" aria-label={rotulo} className={`${trilho} ${className}`}>
      {abas.map((a) => {
        const atual = a.chave === chaveAtiva
        return (
          <button
            key={a.chave}
            type="button"
            role="tab"
            aria-selected={atual}
            onClick={() => onChange(a.chave)}
            className={`${item} ${atual ? ativa : inativa}`}
          >
            {a.rotulo}
            {a.contagem !== undefined && <Contagem n={a.contagem} destaque={atual} />}
          </button>
        )
      })}
    </div>
  )
}
