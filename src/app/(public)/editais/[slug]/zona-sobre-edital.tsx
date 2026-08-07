import { Cartela } from '@/components/ui/cartela'
import { TextoEdital } from './texto-edital'

interface ZonaSobreEditalProps {
  resumo: string | null
  regrasElegibilidade: string | null
  acoesAfirmativas: string | null
}

/**
 * "Sobre o edital" como um campo só, com um bloco por assunto presente.
 *
 * Resumo, elegibilidade e ações afirmativas respondem à mesma pergunta de
 * leitura ("isso é pra mim?") e nem todo edital preenche os três. Três
 * faixas de cor cheias em sequência pesava sempre o máximo, mesmo com um
 * campo só; aqui é um campo de papel, e cada bloco presente carrega sua
 * cartela na cor institucional própria — a variação de texto dentro de cada
 * um não mexe na estrutura da zona.
 */
export function ZonaSobreEdital({ resumo, regrasElegibilidade, acoesAfirmativas }: ZonaSobreEditalProps) {
  if (!resumo && !regrasElegibilidade && !acoesAfirmativas) return null

  return (
    <section className="papel-textura bg-papel-50">
      <div className="mx-auto max-w-7xl space-y-14 px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        {resumo && (
          <div>
            <Cartela id="resumo" cor="terracota">
              Do que se trata
            </Cartela>
            <div className="mt-8">
              <TextoEdital texto={resumo} />
            </div>
          </div>
        )}

        {regrasElegibilidade && (
          <div>
            <Cartela id="elegibilidade" cor="turquesa">
              Quem pode se inscrever
            </Cartela>
            <div className="mt-8">
              <TextoEdital texto={regrasElegibilidade} />
            </div>
          </div>
        )}

        {acoesAfirmativas && (
          <div>
            <Cartela id="acoes" cor="ameixa">
              Ações afirmativas
            </Cartela>
            <div className="mt-8">
              <TextoEdital texto={acoesAfirmativas} />
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
