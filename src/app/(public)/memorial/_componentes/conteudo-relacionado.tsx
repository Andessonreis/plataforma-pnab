import { comparaveis, Comparacoes } from './comparacoes'
import { fotosPublicas } from './consultas'
import { GradeFotos } from './grade-fotos'
import { LinhaDoTempo, type EventoDaLinha } from './linha-do-tempo'
import { RetratosPessoas, type PessoaResumo } from './retratos-pessoas'

type Item = Parameters<typeof fotosPublicas>[0][number] & Parameters<typeof comparaveis>[0][number]

interface ConteudoRelacionadoProps {
  itens: Item[]
  pessoas?: PessoaResumo[]
  eventos?: Omit<EventoDaLinha, 'itens'>[]
}

const LARGURA = 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'
const TITULO = 'titulo mb-8 text-3xl leading-none sm:text-4xl'

/**
 * O que está ligado a uma exposição ou pessoa: comparações antes/hoje, fotos,
 * personagens e acontecimentos. Cada bloco só aparece se tiver conteúdo publicado.
 */
export function ConteudoRelacionado({ itens, pessoas = [], eventos = [] }: ConteudoRelacionadoProps) {
  const pares = comparaveis(itens)
  const fotos = fotosPublicas(itens.filter((i) => !pares.includes(i)))

  return (
    <>
      {pares.length > 0 && (
        <section aria-labelledby="antes-hoje-titulo" className="bg-papel-100 py-12 sm:py-16">
          <div className={LARGURA}>
            <h2 id="antes-hoje-titulo" className={`${TITULO} text-tinta-900`}>Antes e hoje</h2>
            <Comparacoes itens={pares} />
          </div>
        </section>
      )}
      {fotos.length > 0 && (
        <section aria-labelledby="fotos-titulo" className="papel-textura bg-papel-50 py-12 sm:py-16">
          <div className={LARGURA}>
            <h2 id="fotos-titulo" className={`${TITULO} text-tinta-900`}>Fotografias</h2>
            <GradeFotos fotos={fotos} />
          </div>
        </section>
      )}
      {pessoas.length > 0 && (
        <section aria-labelledby="pessoas-titulo" className="bg-papel-100 py-12 sm:py-16">
          <div className={LARGURA}>
            <h2 id="pessoas-titulo" className={`${TITULO} text-tinta-900`}>Pessoas</h2>
            <RetratosPessoas pessoas={pessoas} />
          </div>
        </section>
      )}
      {eventos.length > 0 && (
        <section aria-labelledby="eventos-titulo" className="bg-tinta-950 py-12 sm:py-16">
          <div className={LARGURA}>
            <h2 id="eventos-titulo" className={`${TITULO} text-papel-50`}>Acontecimentos</h2>
            <LinhaDoTempo eventos={eventos.map((e) => ({ ...e, itens: [] }))} resumo nivel="h3" />
          </div>
        </section>
      )}
    </>
  )
}
