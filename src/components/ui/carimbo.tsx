/**
 * Tons do carimbo, tirados dos conceitos que a identidade SECULT atribui a
 * cada cor: oliva é safra e esperança (o que deu certo ou está aberto), âmbar
 * é vitalidade (o que está em curso), turquesa é prestação e acolhimento,
 * tinta é o registro arquivado.
 */
export type TomCarimbo = 'safra' | 'curso' | 'prestacao' | 'arquivo'

interface CarimboProps {
  tom: TomCarimbo
  children: React.ReactNode
  className?: string
}

const TONS: Record<TomCarimbo, string> = {
  safra: 'border-oliva-700 bg-oliva-700/10 text-oliva-800',
  curso: 'border-accent-600 bg-accent-500/10 text-accent-800',
  prestacao: 'border-turquesa-700 bg-turquesa-600/10 text-turquesa-800',
  arquivo: 'border-tinta-400 bg-tinta-900/5 text-tinta-600',
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
export function Carimbo({ tom, children, className = '' }: CarimboProps) {
  return (
    <span
      className={`inline-block -rotate-[1.5deg] border-2 px-2.5 py-1 text-[0.6875rem] font-bold uppercase leading-none tracking-[0.16em] ${TONS[tom]} ${className}`}
    >
      {children}
    </span>
  )
}
