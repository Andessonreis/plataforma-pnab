import Link from 'next/link'
import { IconArrowRight } from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import type { ConviteEditais, ItemConvite, SituacaoConvite } from './convite-editais'
import { botaoContorno, botaoOuro, focoEscuro } from './estilos'
import { contagemRegressiva } from './prazos'

const TITULO: Record<SituacaoConvite, string> = {
  abertos: 'Editais abertos para você se inscrever',
  proximos: 'Nenhum edital com inscrições abertas agora',
  nenhum: 'Nenhum edital em andamento no momento',
}

const SUBTITULO: Record<SituacaoConvite, string> = {
  abertos: 'Veja as regras de cada um antes de começar a inscrição.',
  proximos: 'Acompanhe os editais em andamento e os que vão abrir inscrições.',
  nenhum:
    'Quando a Secretaria publicar um edital, ele aparece neste quadro e na página de editais. Os avisos do portal chegam em Notificações.',
}

/** Linha de prazo do item: nos abertos, quanto falta; nos demais, a fase e o próximo marco. */
function linhaDoMarco({ situacao, marco }: ItemConvite): string | null {
  const data = marco ? `${marco.label}: ${formatDate(marco.dataHora)}` : null
  if (!situacao) return marco ? `${data} (${contagemRegressiva(marco.dataHora).toLowerCase()})` : null
  return data ? `${situacao} · ${data}` : situacao
}

function ItemEdital({ item }: { item: ItemConvite }) {
  const marco = linhaDoMarco(item)
  return (
    <li className="border-t border-papel-50/20 first:border-t-0">
      <Link
        href={`/editais/${item.slug}`}
        className={`group flex min-h-[64px] items-center justify-between gap-4 py-3 ${focoEscuro} [@media(hover:hover)]:hover:bg-papel-50/5`}
      >
        <span className="min-w-0">
          <span className="block font-semibold leading-snug [@media(hover:hover)]:group-hover:underline">{item.titulo}</span>
          {marco && <span className="mt-0.5 block text-sm text-papel-100">{marco}</span>}
          {item.valorTotal !== null && (
            <span className="block text-sm text-papel-100">Valor total {formatCurrency(item.valorTotal)}</span>
          )}
        </span>
        <IconArrowRight className="h-4 w-4 shrink-0 text-accent-300" aria-hidden="true" />
      </Link>
    </li>
  )
}

/**
 * Ocupa o lugar do bloco "agora" para quem ainda não se inscreveu em edital:
 * em vez de "nada pendente", mostra por onde entrar (até três editais) e,
 * sem nenhum em andamento, como acompanhar os próximos. Mesma cartela em
 * tinta do "agora", com o dourado reservado ao botão principal.
 */
export function ConviteEditaisPanel({ convite }: { convite: ConviteEditais }) {
  const { situacao, itens } = convite
  return (
    <section
      aria-labelledby="convite-editais-titulo"
      className="cartela flex flex-col bg-tinta-950 p-6 text-papel-50 [--cartela-filete:rgb(240_233_215/0.5)]"
    >
      <h2 id="convite-editais-titulo" className="titulo text-2xl">
        {TITULO[situacao]}
      </h2>
      <p className="mt-2 max-w-prose text-papel-100">{SUBTITULO[situacao]}</p>

      {itens.length > 0 && (
        <ul className="mt-4 border-y border-papel-50/20">
          {itens.map((item) => (
            <ItemEdital key={item.editalId} item={item} />
          ))}
        </ul>
      )}

      <div className="mt-auto flex flex-wrap gap-3 pt-6">
        <Link id="tour-cta-principal" href="/editais" className={botaoOuro}>
          Ver editais
          <IconArrowRight className="h-4 w-4" />
        </Link>
        {situacao === 'nenhum' && (
          <Link href="/proponente/notificacoes" className={botaoContorno}>
            Notificações
          </Link>
        )}
      </div>
    </section>
  )
}
