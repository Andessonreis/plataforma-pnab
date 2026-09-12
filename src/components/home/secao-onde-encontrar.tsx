import { Button, IconMapPin, IconPhone, IconClock, IconInstagram, IconQuestion } from '@/components/ui'
import { Casario } from '@/components/ui/ornamentos'

const ENDERECO = 'Praça Teotônio Marques Dourado Filho, 1 — Centro, Irecê/BA — CEP 44.900-000'
const TELEFONE = '(74) 3641-3116'
const TELEFONE_TEL = '+557436413116'
const INSTAGRAM_URL = 'https://www.instagram.com/secult.irece/'
const MAPA_EMBED_URL = 'https://www.google.com/maps?q=-11.302940,-41.858314&z=16&output=embed'

/**
 * Fecho da home: onde a Secretaria fica de verdade e como pedir ajuda
 * presencial pra quem trava na inscrição — o mesmo motivo de existir do
 * e-mail no rodapé, só que antes dele, com endereço, mapa e telefone reais.
 */
export function SecaoOndeEncontrar() {
  return (
    <section className="relative overflow-hidden bg-tinta-900 py-12 sm:py-16">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-screen"
        style={{
          backgroundImage: 'url(/images/secult/mapa-irece.png)',
          backgroundSize: 'auto 100%',
          backgroundRepeat: 'repeat-x',
        }}
        aria-hidden="true"
      />

      <Casario className="pointer-events-none absolute -bottom-4 -left-6 hidden h-24 w-auto text-turquesa-500/20 lg:block lg:h-32" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="mb-3 titulo text-2xl leading-tight tracking-wide text-papel-50 sm:text-3xl">
              Visite a Secretaria
            </h2>
            <p className="mb-6 leading-relaxed text-papel-200">
              A Secretaria de Cultura e Turismo funciona no prédio da Prefeitura de Irecê, na
              praça central da cidade.
            </p>

            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <IconMapPin className="mt-0.5 h-5 w-5 shrink-0 text-accent-400" />
                <span className="leading-relaxed text-papel-200">{ENDERECO}</span>
              </li>
              <li className="flex items-start gap-3">
                <IconPhone className="mt-0.5 h-5 w-5 shrink-0 text-accent-400" />
                <a
                  href={`tel:${TELEFONE_TEL}`}
                  className="font-semibold text-papel-50 underline decoration-accent-300 decoration-2 underline-offset-4 transition-colors hover:text-accent-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-300"
                >
                  {TELEFONE}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <IconClock className="mt-0.5 h-5 w-5 shrink-0 text-accent-400" />
                <span className="leading-relaxed text-papel-200">
                  Segunda a sexta-feira, das 8h às 14h
                </span>
              </li>
              <li className="flex items-start gap-3">
                <IconInstagram className="mt-0.5 h-5 w-5 shrink-0 text-accent-400" />
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-papel-50 underline decoration-accent-300 decoration-2 underline-offset-4 transition-colors hover:text-accent-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-300"
                >
                  @secult.irece
                </a>
              </li>
            </ul>

            <div className="mt-6 overflow-hidden rounded-md border-2 border-papel-100/20">
              <iframe
                src={MAPA_EMBED_URL}
                title="Mapa de localização da Secretaria de Cultura e Turismo de Irecê"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-64 w-full sm:h-72"
              />
            </div>
          </div>

          <div className="flex flex-col justify-center border-t-2 border-papel-100/15 pt-8 lg:border-l-2 lg:border-t-0 lg:pl-16 lg:pt-0">
            <IconQuestion className="h-8 w-8 shrink-0 text-accent-400" />

            <h3 className="mt-4 titulo text-xl leading-tight tracking-wide text-papel-50 sm:text-2xl">
              Precisa de ajuda para se inscrever?
            </h3>
            <p className="mt-3 leading-relaxed text-papel-200">
              O atendimento é presencial e gratuito. A equipe da Secretaria faz o cadastro com
              você — basta ir até lá com os seus documentos.
            </p>

            <p className="mt-4 border-l-4 border-accent-500 pl-4 rotulo text-xs leading-snug text-accent-200">
              Não é preciso pagar nada a ninguém.
            </p>

            <Button href="/contato" variant="secondary" className="mt-6 self-start">
              Falar com a Secretaria
            </Button>
          </div>
        </div>
      </div>

      <div className="serrilha absolute inset-x-0 bottom-0 text-accent-500" aria-hidden="true" />
    </section>
  )
}
