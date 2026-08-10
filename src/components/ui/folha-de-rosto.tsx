import Link from 'next/link'
import { FundoFotos } from './fundo-fotos'

interface FolhaDeRostoProps {
  /** Fotos do rodízio de fundo. Cada seção usa um recorte e uma ordem própria. */
  fotos: string[]
  /** Nome da página na trilha. A raiz é sempre Início. */
  trilha: string
  /** Linha manuscrita acima do título. */
  chamada: string
  titulo: string
  apoio?: string
  /** Resumo próprio da seção: contagens, prazo, data da última publicação. */
  children?: React.ReactNode
  /** Variante reduzida — cabeçalho de sub-rota (resultados, versão acessível),
   *  que precisa da mesma identidade sem repetir o peso da capa principal. */
  compacto?: boolean
}

/**
 * Faixa de abertura de seção, sobre fotografia da cultura de Irecê.
 *
 * Estava reescrita em editais, projetos apoiados e notícias, com as mesmas
 * quatro camadas em cada uma — fotografia, véu de tinta, conteúdo e serrilha.
 * O que muda de página para página é só o recorte de fotos e o resumo, que
 * entra por `children`.
 *
 * O véu de tinta do lado do texto não é decorativo: o banho geral da
 * fotografia não dá conta de zonas claras (uma saia de quadrilha, uma luz de
 * palco), e o título não pode depender de qual foto está em cena.
 */
export function FolhaDeRosto({
  fotos,
  trilha,
  chamada,
  titulo,
  apoio,
  children,
  compacto = false,
}: FolhaDeRostoProps) {
  return (
    <section className="relative overflow-hidden bg-brand-700 text-papel-100">
      <FundoFotos fotos={fotos} />

      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-tinta-950/70 via-tinta-950/50 to-tinta-950/20"
        aria-hidden="true"
      />

      <div
        className={`relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${
          compacto ? 'pb-8 pt-6 sm:pb-9 sm:pt-7' : 'pb-12 pt-8 sm:pb-14 sm:pt-10'
        }`}
      >
        <nav aria-label="Trilha de navegação" className="mb-8 text-xs tracking-wide text-papel-200/80">
          <Link href="/" className="underline-offset-4 hover:text-accent-300 hover:underline">
            Início
          </Link>
          <span className="px-2" aria-hidden="true">
            /
          </span>
          <span className="text-papel-50">{trilha}</span>
        </nav>

        <p className="mb-1 rotulo text-xs text-accent-300">{chamada}</p>
        <h1
          className={`titulo leading-tight tracking-wide text-papel-50 ${
            compacto ? 'text-2xl sm:text-4xl' : 'text-3xl sm:text-5xl'
          }`}
        >
          {titulo}
        </h1>
        {apoio && (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-papel-100/90">{apoio}</p>
        )}

        {children}
      </div>

      <div className="serrilha absolute inset-x-0 bottom-0 text-papel-100" aria-hidden="true" />
    </section>
  )
}
