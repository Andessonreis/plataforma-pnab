import { renderMarkdown, stripMarkdown } from '@/lib/utils/markdown'
import { paraFoto } from './consultas'
import { FotoComCredito } from './foto-com-credito'

type ItemDaLinha = Parameters<typeof paraFoto>[0]

export interface EventoDaLinha {
  id: string
  slug: string
  titulo: string
  descricao: string | null
  periodo: string | null
  ano: number | null
  itens: ItemDaLinha[]
}

function porDecada(eventos: EventoDaLinha[]) {
  const grupos = new Map<number, EventoDaLinha[]>()
  for (const e of eventos) {
    const decada = Math.floor((e.ano ?? 0) / 10) * 10
    grupos.set(decada, [...(grupos.get(decada) ?? []), e])
  }
  return [...grupos.entries()]
}

/**
 * Linha do tempo agrupada por década, com o ano grande na margem. No modo `resumo`
 * (página inicial), cada evento mostra só um trecho; na página própria, o texto
 * inteiro e a foto que o acompanha.
 */
export function LinhaDoTempo({
  eventos,
  resumo = false,
  nivel = 'h2',
}: {
  eventos: EventoDaLinha[]
  resumo?: boolean
  /** Nível do título da década; o do evento é o seguinte. */
  nivel?: 'h2' | 'h3'
}) {
  const Decada = nivel
  const Evento = nivel === 'h2' ? 'h3' : 'h4'
  return (
    <ol className="space-y-12">
      {porDecada(eventos).map(([decada, lista]) => (
        <li key={decada} className="grid gap-4 sm:grid-cols-[9rem_1fr] sm:gap-10">
          <Decada className="titulo text-5xl leading-none text-accent-400 sm:sticky sm:top-24 sm:self-start sm:text-6xl">
            {decada ? `Anos ${decada}` : 'Sem data'}
          </Decada>
          <ol className="space-y-8 border-l-2 border-papel-100/25 pl-5 sm:pl-8">
            {lista.map((e) => {
              const foto = !resumo && e.itens[0] ? paraFoto(e.itens[0]) : null
              return (
                <li key={e.id} className="relative">
                  <span className="absolute -left-[1.6rem] top-2 h-3 w-3 rounded-full bg-accent-400 sm:-left-[2.35rem]" aria-hidden="true" />
                  <p className="text-sm font-semibold text-accent-300">{e.periodo ?? e.ano}</p>
                  <Evento className="mt-1 text-xl font-semibold leading-snug text-papel-50 sm:text-2xl">{e.titulo}</Evento>
                  {e.descricao && resumo && (
                    <p className="mt-2 max-w-2xl text-base leading-relaxed text-papel-200">{stripMarkdown(e.descricao, 220)}</p>
                  )}
                  {e.descricao && !resumo && (
                    <div className="mt-3 max-w-2xl text-base leading-relaxed text-papel-200 [&_*]:text-inherit">
                      {renderMarkdown(e.descricao)}
                    </div>
                  )}
                  {foto && (
                    <div className="mt-5 max-w-md">
                      <FotoComCredito foto={foto} sizes="(min-width: 640px) 28rem, 100vw" />
                    </div>
                  )}
                </li>
              )
            })}
          </ol>
        </li>
      ))}
    </ol>
  )
}
