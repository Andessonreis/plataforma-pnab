import { Cartela, type CorCartela } from './cartela'

export type CorFaixa = 'papel' | 'papel-forte' | 'terracota' | 'oliva' | 'turquesa' | 'ameixa' | 'tinta'

const FUNDOS: Record<CorFaixa, string> = {
  papel: 'bg-papel-50 papel-textura text-tinta-800',
  'papel-forte': 'bg-papel-100 text-tinta-800',
  terracota: 'bg-brand-700 text-papel-100',
  oliva: 'bg-oliva-700 text-papel-100',
  turquesa: 'bg-turquesa-700 text-papel-100',
  ameixa: 'bg-ameixa-700 text-papel-100',
  tinta: 'bg-tinta-950 text-papel-100',
}

/** Faixas escuras pedem cartela clara: cartela de tinta sobre tinta desaparece. */
const CARTELA_EM_FUNDO_ESCURO: Record<string, CorCartela> = {
  terracota: 'tinta',
  oliva: 'tinta',
  turquesa: 'tinta',
  ameixa: 'tinta',
  tinta: 'terracota',
}

interface FaixaSecaoProps {
  id: string
  cartela: string
  cor: CorFaixa
  /** Cor da cartela quando se quer fugir do padrão da faixa. */
  corCartela?: CorCartela
  children: React.ReactNode
}

export const FAIXA_ESCURA: CorFaixa[] = ['terracota', 'oliva', 'turquesa', 'ameixa', 'tinta']

/**
 * Uma parte do documento em faixa de cor de ponta a ponta.
 *
 * O corpo era uma coluna de texto centralizada sobre creme: sobrava um terço
 * de vazio de cada lado e a página inteira ficava com a mesma cor do começo ao
 * fim. A identidade da Secretaria não trabalha assim — as peças dela são
 * campos chapados de cor encostados, e é a troca de campo que separa um
 * assunto do outro.
 *
 * A cartela fica num trilho à esquerda, e não em cima do texto: assim a faixa
 * usa a largura que tem, em vez de empilhar tudo no meio.
 */
export function FaixaSecao({ id, cartela, cor, corCartela, children }: FaixaSecaoProps) {
  return (
    <section className={FUNDOS[cor]}>
      <div className="mx-auto grid max-w-7xl gap-x-10 gap-y-6 px-4 py-14 sm:px-6 lg:grid-cols-[15rem_1fr] lg:px-8 lg:py-16">
        <div className="lg:pt-1">
          <Cartela id={id} cor={corCartela ?? CARTELA_EM_FUNDO_ESCURO[cor] ?? 'tinta'}>
            {cartela}
          </Cartela>
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  )
}
