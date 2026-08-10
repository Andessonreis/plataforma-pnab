import Image from 'next/image'
import { Varal } from '@/components/ui/varal'
import { NewsletterForm } from '../newsletter-form'
import { ColunaMarca } from './coluna-marca'
import { ColunaLinks } from './coluna-links'
import { Selos } from './selos'
import { linksNavegacao, linksProponente, linksLegais } from './links'

interface FooterProps {
  /** Faixa de casario no topo do rodapé. Default true — desative em áreas logadas/produto. */
  showVaral?: boolean
}

/**
 * Rodapé institucional do portal.
 *
 * Carrega a identidade da Secretaria (`tema-secult`) em todas as páginas: é a
 * assinatura do site, e o marrom-tinta funciona como fecho neutro tanto sob a
 * home quanto sob as páginas que ainda usam a paleta antiga.
 */
function Footer({ showVaral = true }: FooterProps) {
  const anoAtual = new Date().getFullYear()

  return (
    <footer className="tema-secult bg-tinta-950 text-papel-200 font-questrial" role="contentinfo">
      {/* Faixa de casario da identidade visual, no lugar da antiga faixa de gradiente */}
      {showVaral && <Varal />}

      <div className="border-b border-papel-100/[0.08]">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="shrink-0">
              <h2 className="titulo text-sm tracking-wide text-papel-50">
                Receba novidades sobre editais
              </h2>
              <p className="mt-0.5 text-xs text-papel-200/60">
                Novos editais, prazos e resultados no seu e-mail.
              </p>
            </div>
            <div className="min-w-0 flex-1">
              <NewsletterForm />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 py-8 sm:grid-cols-2 sm:gap-10 sm:py-12 lg:grid-cols-12">
          <ColunaMarca />

          {/* No mobile as duas colunas de links dividem a linha; a partir de sm
              voltam a ser filhas diretas do grid principal. */}
          <div className="grid grid-cols-2 gap-6 sm:contents">
            <ColunaLinks titulo="Navegação" links={linksNavegacao} className="lg:col-span-3" />
            <div className="lg:col-span-3">
              <ColunaLinks titulo="Área do Proponente" links={linksProponente} />
              <div className="mt-6 sm:mt-8">
                <ColunaLinks titulo="Legal" links={linksLegais} />
              </div>
            </div>
          </div>

          <Selos />
        </div>
      </div>

      <div className="border-t border-papel-100/[0.08]">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-2 text-xs text-papel-200/50 sm:flex-row sm:gap-3">
            <p className="text-center sm:text-left">
              &copy; {anoAtual} Secretaria de Cultura e Turismo — Prefeitura Municipal de Irecê/BA
            </p>
            <Image
              src="/images/marca/brasao-irece.png"
              alt="Brasão de Irecê"
              width={28}
              height={28}
              className="h-7 w-auto opacity-70"
            />
          </div>
        </div>
      </div>
    </footer>
  )
}

export { Footer }
