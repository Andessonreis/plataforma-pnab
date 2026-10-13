import Link from 'next/link'
import { IconArrowRight } from '@/components/ui'
import type { ProximaVisita } from '@/lib/memorial/agendamento/proximas-visitas'
import { ROTULO_STATUS } from '@/lib/memorial/agendamento/status'
import { botaoContorno, botaoPapel } from './estilos'
import { VisitaCartao, visitaEmPoucasPalavras, type VisitaMemorial } from './visita-cartao'
import { VisitasPager } from './visitas-pager'

interface MemorialDestaqueProps {
  /** Visitas por vir, da mais próxima para a mais distante. */
  proximas: ProximaVisita<VisitaMemorial>[]
  /** Mais recente das que já passaram (ou foram recusadas/canceladas). */
  ultima: VisitaMemorial | null
  /** Quantos pedidos a conta já fez; zero esconde o atalho de acompanhamento. */
  total: number
  /** Convite discreto, para quem usa o portal pelos editais e não tem visita marcada. */
  compacto?: boolean
}

function rotuloDaProxima(visita: ProximaVisita<VisitaMemorial>, posicao: number): string {
  if (visita.emAndamento) return 'Acontecendo agora'
  return posicao === 0 ? 'Próxima visita' : 'Em seguida'
}

/** O miolo do bloco: pager, uma visita só, a última que passou ou o convite. */
function conteudoDoBloco(proximas: ProximaVisita<VisitaMemorial>[], ultima: VisitaMemorial | null, compacto: boolean) {
  const slides = proximas.map((v, i) => <VisitaCartao key={v.protocolo} visita={v} rotulo={rotuloDaProxima(v, i)} />)
  if (slides.length > 1) return <VisitasPager slides={slides} resumos={proximas.map(visitaEmPoucasPalavras)} />
  if (slides.length === 1) return slides[0]

  if (ultima && compacto) {
    return (
      <p className="text-sm text-papel-100">
        Última visita em {visitaEmPoucasPalavras(ultima)}, {ROTULO_STATUS[ultima.status].toLowerCase()}.
      </p>
    )
  }
  if (ultima) return <VisitaCartao visita={ultima} rotulo="Última visita" />

  return (
    <p className={compacto ? 'text-sm text-papel-100' : 'text-papel-100'}>
      Leve sua escola, seu grupo ou sua família para uma visita guiada e conhecer a história da cidade.
    </p>
  )
}

/**
 * Bloco do Memorial de Irecê no painel. Com visitas por vir, destaca a mais
 * próxima e deixa as seguintes a um toque (pager); sem nenhuma, mostra a
 * última que passou ou só o convite para agendar.
 */
export function MemorialDestaque({ proximas, ultima, total, compacto = false }: MemorialDestaqueProps) {
  return (
    <section
      id="tour-memorial"
      aria-labelledby="memorial-titulo"
      className={`cartela bg-ameixa-700 text-papel-50 [--cartela-filete:rgb(240_233_215/0.35)] ${compacto ? 'p-5' : 'p-6'}`}
    >
      <h2 id="memorial-titulo" className={`titulo ${compacto ? 'text-xl' : 'text-2xl'}`}>
        Memorial de Irecê
      </h2>

      <div className="mt-4">{conteudoDoBloco(proximas, ultima, compacto)}</div>

      <div className={`flex flex-wrap gap-3 ${compacto ? 'mt-5' : 'mt-6'}`}>
        {total > 0 ? (
          <>
            <Link href="/proponente/memorial/visitas" className={botaoPapel}>
              Minhas visitas{total > 1 ? ` (${total})` : ''}
              <IconArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/proponente/memorial" className={botaoContorno}>
              Agendar outra
            </Link>
          </>
        ) : (
          <Link href="/proponente/memorial" className={botaoPapel}>
            Agendar visita
            <IconArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </section>
  )
}
