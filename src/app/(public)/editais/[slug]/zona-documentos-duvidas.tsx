import { Cartela } from '@/components/ui/cartela'
import { AnexosEdital, type ArquivoEdital } from './anexos-edital'
import { DuvidasEdital } from './duvidas-edital'

interface ZonaDocumentosDuvidasProps {
  arquivos: ArquivoEdital[]
  duvidas: { id: string; pergunta: string; resposta: string }[]
}

/**
 * Documentos e dúvidas lado a lado no desktop.
 *
 * As duas são material de consulta, não de leitura linear — colocá-las juntas
 * reduz a distância de rolagem no desktop sem prejudicar a leitura sequencial
 * no celular, onde as duas colunas já empilham naturalmente.
 */
export function ZonaDocumentosDuvidas({ arquivos, duvidas }: ZonaDocumentosDuvidasProps) {
  if (arquivos.length === 0 && duvidas.length === 0) return null

  return (
    <section className="bg-papel-100">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-x-10 lg:gap-y-0">
          {arquivos.length > 0 && (
            <div>
              <Cartela id="anexos" cor="ameixa">
                Documentos do edital
              </Cartela>
              <div className="mt-8">
                <AnexosEdital arquivos={arquivos} />
              </div>
            </div>
          )}

          {duvidas.length > 0 && (
            <div>
              <Cartela id="duvidas" cor="turquesa">
                Dúvidas deste edital
              </Cartela>
              <div className="mt-8">
                <DuvidasEdital duvidas={duvidas} />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
