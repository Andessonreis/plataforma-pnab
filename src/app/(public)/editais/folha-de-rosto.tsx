import Link from 'next/link'
import { FundoFotos } from '@/components/ui/fundo-fotos'
import { IconeEdital, IconePrazo } from '@/components/ui/ornamentos/icones'

interface FolhaDeRostoProps {
  publicados: number
  abertos: number
  /** Menor prazo entre os editais abertos, para a chamada de urgência. */
  proximoEncerramento: { titulo: string; dias: number } | null
}

const FOTOS = [
  '/images/galeria/foto-05.png', // bandeirinhas e praça cheia
  '/images/galeria/foto-03.png', // arraiá no coreto
  '/images/galeria/foto-01.png', // quadrilha infantil
]

/**
 * Abertura da seção sobre fotografia, como a da home.
 *
 * Editais é a razão pela qual o portal existe, e a faixa estava chapada
 * enquanto a home abria com imagem — a página mais importante parecia a menos
 * cuidada. A ordem das fotos difere da home de propósito, para que quem
 * navega de uma para a outra não veja a mesma abertura duas vezes.
 *
 * A faixa carrega o que decide a visita: quantos editais estão abertos e
 * quanto tempo resta no mais próximo de fechar. Contagem de dias, e não data,
 * porque é o que faz a pessoa agir hoje.
 */
export function FolhaDeRosto({ publicados, abertos, proximoEncerramento }: FolhaDeRostoProps) {
  return (
    <section className="relative overflow-hidden bg-brand-900 text-papel-100">
      <FundoFotos fotos={FOTOS} />

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-screen"
        style={{
          backgroundImage: 'url(/images/secult/mapa-irece.png)',
          backgroundSize: 'auto 100%',
          backgroundRepeat: 'repeat-x',
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 sm:pb-14 sm:pt-10 lg:px-8">
        <nav aria-label="Trilha de navegação" className="mb-8 text-xs tracking-wide text-papel-200/80">
          <Link href="/" className="underline-offset-4 hover:text-accent-300 hover:underline">
            Início
          </Link>
          <span className="px-2" aria-hidden="true">
            /
          </span>
          <span className="text-papel-50">Editais</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div>
            <p className="mb-1 -rotate-1 font-caveat text-2xl text-accent-300">Fomento à cultura</p>
            <h1 className="font-rye text-3xl leading-tight tracking-wide text-papel-50 sm:text-5xl">
              Editais da PNAB Irecê
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-papel-100/90">
              Chamamentos públicos da Política Nacional Aldir Blanc no município. Cada edital traz
              prazo, valor e a íntegra do documento para leitura.
            </p>
          </div>

          <div className="flex flex-col gap-4 rounded-sm bg-tinta-950/85 p-5">
            <div className="flex items-center gap-4">
              <IconeEdital className="h-8 w-8 shrink-0 text-accent-400" />
              <p className="text-sm text-papel-100">
                <span className="font-rye text-2xl leading-none text-accent-300">{abertos}</span>{' '}
                {abertos === 1 ? 'edital aberto' : 'editais abertos'} de {publicados} publicados
              </p>
            </div>

            {proximoEncerramento && (
              <div className="flex items-center gap-4 border-t border-papel-100/15 pt-4">
                <IconePrazo className="h-8 w-8 shrink-0 text-accent-400" />
                <p className="text-sm leading-snug text-papel-100">
                  O mais próximo de fechar encerra em{' '}
                  <span className="font-rye text-lg leading-none text-accent-300">
                    {proximoEncerramento.dias === 0
                      ? 'algumas horas'
                      : `${proximoEncerramento.dias} ${proximoEncerramento.dias === 1 ? 'dia' : 'dias'}`}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="serrilha absolute inset-x-0 bottom-0 text-papel-100" aria-hidden="true" />
    </section>
  )
}
