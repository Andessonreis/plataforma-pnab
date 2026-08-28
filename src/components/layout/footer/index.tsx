import { Varal } from '@/components/ui/varal'
import { NewsletterForm } from '../newsletter-form'
import { Assinatura } from './assinatura'
import { ColunaMarca } from './coluna-marca'
import { ColunaLinks } from './coluna-links'
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
 *
 * Antes eram cinco faixas empilhadas — casario, newsletter, links, crédito do
 * desenvolvimento, copyright — separadas por quatro fios claros. Fio é o
 * recurso mais barato para dizer "aqui termina uma coisa e começa outra", e
 * quatro deles seguidos picam o rodapé em tiras que não parecem do mesmo
 * bloco. A identidade da Secretaria também não trabalha assim: ela encosta
 * campos chapados de cor, sem contorno.
 *
 * Restaram duas partes e um fio só entre elas: o corpo (quem somos, para onde
 * ir, receber avisos) e a assinatura. A newsletter deixou de ocupar faixa
 * inteira para virar coluna do mesmo grid — um campo de e-mail não precisa de
 * faixa própria, precisa estar perto do motivo de assinar, que são os editais
 * linkados ao lado.
 */
function Footer({ showVaral = true }: FooterProps) {
  return (
    <footer className="tema-secult bg-tinta-950 font-questrial text-papel-200" role="contentinfo">
      {showVaral && <Varal />}

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-12">
          <ColunaMarca />

          <ColunaLinks titulo="Navegar" links={linksNavegacao} className="lg:col-span-2" />

          <div className="lg:col-span-2">
            <ColunaLinks titulo="Sua conta" links={linksProponente} />
            <div className="mt-8">
              <ColunaLinks titulo="Termos" links={linksLegais} />
            </div>
          </div>

          <div className="sm:col-span-2 lg:col-span-4">
            <h2 className="mb-3 text-base font-semibold leading-none text-papel-50">Avisos de novos editais</h2>
            <p className="mb-4 max-w-sm text-[0.9375rem] leading-relaxed text-papel-200/80">
              Deixe seu e-mail e avisamos quando abrir inscrição, quando o prazo estiver
              acabando e quando sair resultado.
            </p>
            <NewsletterForm />
          </div>
        </div>
      </div>

      <Assinatura />
    </footer>
  )
}

export { Footer }
