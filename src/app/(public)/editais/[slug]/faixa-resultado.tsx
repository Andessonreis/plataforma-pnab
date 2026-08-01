import Link from 'next/link'
import { IconArrowRight } from '@/components/ui/icons'
import type { ResultadoPublicado } from '../resultado-publicado'

interface FaixaResultadoProps {
  resultado: ResultadoPublicado
}

/**
 * Chamada para a classificação, logo abaixo da capa do edital.
 *
 * A página de resultados existia sem que nada no site levasse até ela: só
 * chegava quem tinha o link do e-mail de notificação. Num edital de dinheiro
 * público isso é o oposto do que se espera — o resultado é a informação mais
 * procurada depois que o prazo fecha, e era a única sem porta de entrada.
 *
 * Fica acima do texto do edital de propósito. Quem volta a um edital encerrado
 * não vem reler o objeto e as condições de habilitação, vem ver quem passou.
 *
 * A cor separa as duas situações sem depender de ler: turquesa enquanto cabe
 * recurso, oliva quando a classificação já é definitiva.
 */
export function FaixaResultado({ resultado }: FaixaResultadoProps) {
  const fundo = resultado.preliminar ? 'bg-turquesa-700' : 'bg-oliva-700'

  return (
    <section className={`${fundo} text-papel-100`}>
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 sm:py-10 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="rotulo text-[0.7rem] text-papel-100/80">
            {resultado.preliminar ? 'Ainda cabe recurso' : 'Classificação definitiva'}
          </p>
          <h2 className="titulo mt-2 text-3xl leading-tight text-papel-50 sm:text-4xl">
            {resultado.titulo}
          </h2>
          <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-papel-100/85">
            {resultado.preliminar
              ? 'A classificação já pode ser consultada. Confira a sua posição e, se for o caso, entre com recurso dentro do prazo do cronograma.'
              : 'A lista de classificados deste edital está publicada, com pontuação e situação de cada proposta.'}
          </p>
        </div>

        <Link
          href={resultado.href}
          className="group inline-flex min-h-[52px] shrink-0 items-center gap-2 bg-accent-500 px-7 text-xs font-bold uppercase tracking-[0.14em] text-tinta-950 transition-colors hover:bg-accent-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-papel-100"
        >
          Ver classificação
          <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  )
}
