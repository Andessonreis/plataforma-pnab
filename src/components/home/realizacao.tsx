import { SeloCidadesInteligentes } from '@/components/marca/selo-cidades-inteligentes'

/**
 * Fecho da home com o crédito de desenvolvimento do portal.
 * Fica sobre o papel claro da seção de serviços que vem antes, então usa a
 * arte de texto grafite.
 */
export function Realizacao() {
  return (
    <section
      className="papel-textura border-t-2 border-tinta-900/10 bg-papel-100 py-9 sm:py-12"
      aria-labelledby="realizacao-titulo"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 id="realizacao-titulo" className="sr-only">
          Realização do portal
        </h2>

        <div className="flex flex-col items-center gap-4 text-center">
          <SeloCidadesInteligentes fundo="claro" tamanho="md" centralizado />

          <p className="max-w-xl text-sm leading-relaxed text-tinta-950/60">
            O Portal PNAB Irecê foi desenvolvido no âmbito do Projeto Cidades Inteligentes
            Municípios, do Instituto Federal da Bahia — Campus Irecê, em parceria com a
            Prefeitura Municipal de Irecê.
          </p>
        </div>
      </div>
    </section>
  )
}
