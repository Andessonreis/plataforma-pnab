import { Cartela, type CorCartela } from '@/components/ui/cartela'

interface TextoEditalProps {
  id: string
  titulo: string
  texto: string
  cor?: CorCartela
}

/**
 * Bloco de texto corrido do edital: resumo, elegibilidade, ações afirmativas.
 *
 * O conteúdo vem do admin como texto simples com quebras de linha, então a
 * renderização preserva as quebras e limita a medida de leitura. Sem isso, um
 * parágrafo de regras atravessava a largura inteira da página.
 */
export function TextoEdital({ id, titulo, texto, cor }: TextoEditalProps) {
  return (
    <section>
      <Cartela id={id} cor={cor}>
        {titulo}
      </Cartela>
      <p className="mt-6 max-w-3xl whitespace-pre-line text-base leading-relaxed text-tinta-700">
        {texto}
      </p>
    </section>
  )
}
