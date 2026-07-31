import Link from 'next/link'
import { SolEspiral } from '@/components/ui/ornamentos'

interface FolhaDeRostoProps {
  total: number
  abertos: number
}

/**
 * Abertura da seção como folha de rosto de publicação oficial.
 *
 * O cabeçalho anterior era o mesmo de qualquer página interna: título, uma
 * linha de apoio e a trilha de navegação. Aqui a faixa carrega o que a pessoa
 * veio saber antes de rolar — quantos editais existem e quantos estão abertos
 * agora — porque essa é a pergunta que traz alguém a esta página.
 *
 * O traçado do mapa de Irecê entra como textura de marca e a serrilha fecha a
 * faixa no lugar de uma borda reta.
 */
export function FolhaDeRosto({ total, abertos }: FolhaDeRostoProps) {
  return (
    <section className="relative overflow-hidden bg-brand-900 text-papel-100">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.09] mix-blend-screen"
        style={{
          backgroundImage: 'url(/images/secult/mapa-irece.png)',
          backgroundSize: 'auto 100%',
          backgroundRepeat: 'repeat-x',
        }}
        aria-hidden="true"
      />
      <SolEspiral className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 text-accent-300/20" />

      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 sm:pb-12 sm:pt-10 lg:px-8">
        <nav aria-label="Trilha de navegação" className="mb-6 text-xs tracking-wide text-papel-200/70">
          <Link href="/" className="underline-offset-4 hover:text-accent-300 hover:underline">
            Início
          </Link>
          <span className="px-2" aria-hidden="true">
            /
          </span>
          <span className="text-papel-100">Editais</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-end">
          <div>
            <p className="mb-1 -rotate-1 font-caveat text-2xl text-accent-300">Fomento à cultura</p>
            <h1 className="font-rye text-3xl leading-tight tracking-wide text-papel-50 sm:text-4xl">
              Editais da PNAB Irecê
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-papel-200/85">
              Chamamentos públicos da Política Nacional Aldir Blanc no município. Cada edital traz
              prazo, valor e a íntegra do documento para leitura.
            </p>
          </div>

          <dl className="flex gap-8 border-t border-papel-100/20 pt-5 lg:justify-end lg:border-t-0 lg:pt-0">
            <div>
              <dt className="text-xs font-bold uppercase tracking-[0.16em] text-papel-200/70">
                Publicados
              </dt>
              <dd className="font-rye text-3xl leading-none text-papel-50">{total}</dd>
            </div>
            <div className="border-l border-papel-100/20 pl-8">
              <dt className="text-xs font-bold uppercase tracking-[0.16em] text-accent-300">
                Abertos agora
              </dt>
              <dd className="font-rye text-3xl leading-none text-accent-300">{abertos}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="serrilha absolute inset-x-0 bottom-0 text-papel-100" aria-hidden="true" />
    </section>
  )
}
