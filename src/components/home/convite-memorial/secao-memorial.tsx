import Link from 'next/link'
import { IconArrowRight } from '@/components/ui/icons'
import type { ConviteMemorial } from './tipos'
import { CHAMADA_PRIMARIA } from '../estilos-chamada'
import { EmCartaz } from './em-cartaz'
import { FotoRevelada } from './foto-revelada'
import { PassosVisita } from './passos-visita'

/**
 * A foto da seção é sempre a fachada: a seção apresenta o lugar, e as capas das
 * exposições já aparecem em "Em cartaz" logo abaixo — repetir a capa aqui
 * mostraria a mesma imagem duas vezes.
 */
const FACHADA = {
  src: '/images/memorial/fachada-memorial.jpg',
  alt: 'Fachada do Memorial de Irecê iluminada ao entardecer, com as bandeiras da Bahia, do Brasil e de Irecê',
  legenda: 'O Memorial, hoje',
}

const FOCO = 'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-500'

/**
 * Convite à visita do Memorial na página inicial.
 *
 * O banner da abertura emociona e chama; esta seção explica: o que é o
 * Memorial, o que está em cartaz, como a visita funciona e quando há horário.
 * Fica logo depois do manifesto da Secretaria ("uma terra que fala") — a
 * memória da cidade é a continuação natural dessa fala, e a distância do
 * banner evita que as duas peças pareçam repetidas.
 *
 * Papel claro de propósito: vem entre duas faixas escuras e é texto para ler
 * com calma. Todo conteúdo sai das configurações e do acervo do Memorial.
 */
export function SecaoMemorial({ convite }: { convite: ConviteMemorial }) {
  return (
    <section aria-labelledby="convite-memorial" className="papel-textura relative overflow-hidden bg-papel-100 py-14 sm:py-20">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[5fr_6fr] lg:gap-16">
          <FotoRevelada {...FACHADA} />

          <div>
            <h2 id="convite-memorial" className="titulo text-[2.5rem] leading-[0.95] tracking-wide text-tinta-900 sm:text-6xl">
              {convite.titulo}
            </h2>
            {convite.chamada && (
              <p className="mt-4 text-xl leading-snug text-brand-700 sm:text-2xl">{convite.chamada}</p>
            )}
            <p className="mt-4 max-w-prose text-base leading-relaxed text-tinta-700 sm:text-lg">{convite.texto}</p>

            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link href="/memorial/agendar" className={`${CHAMADA_PRIMARIA} min-h-12 hover:bg-accent-400 ${FOCO}`}>
                Agendar visita
                <IconArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/memorial"
                className={`inline-flex min-h-12 items-center text-sm font-bold text-brand-700 underline decoration-2 underline-offset-4 hover:text-brand-800 ${FOCO}`}
              >
                Conhecer o Memorial
              </Link>
            </div>

            {convite.proximos.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-tinta-800">Próximos horários livres</h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {convite.proximos.map((horario) => (
                    <li key={horario}>
                      <Link
                        href="/memorial/agendar"
                        className={`inline-flex min-h-11 items-center rounded-sm border-2 border-tinta-900/70 px-3 text-sm font-semibold tabular-nums text-tinta-900 transition-colors hover:bg-tinta-900 hover:text-papel-50 ${FOCO}`}
                      >
                        {horario}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="mt-14 space-y-12 sm:mt-16">
          <div>
            <h3 className="titulo mb-5 text-2xl tracking-wide text-tinta-900">Como funciona a visita</h3>
            <PassosVisita regras={convite.regras} />
          </div>
          <EmCartaz exposicoes={convite.exposicoes} />
          {convite.contatos.length > 0 && (
            <p className="border-t border-tinta-900/20 pt-5 text-sm leading-relaxed text-tinta-700">
              <span className="font-bold text-tinta-900">Fale com o Memorial: </span>
              {convite.contatos.join(' · ')}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
