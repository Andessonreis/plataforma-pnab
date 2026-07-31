interface TextoEditalProps {
  texto: string
  /** Sobre faixa de cor, o texto claro; sobre papel, o de tinta. */
  escuro?: boolean
}

/**
 * Bloco de texto corrido do edital: resumo, elegibilidade, ações afirmativas.
 *
 * O conteúdo vem do admin como texto simples com quebras de linha, então a
 * renderização preserva as quebras e limita a medida de leitura — sem isso um
 * parágrafo de regras atravessa a faixa inteira e fica ilegível.
 */
export function TextoEdital({ texto, escuro = false }: TextoEditalProps) {
  return (
    <p
      className={`max-w-3xl whitespace-pre-line text-base leading-relaxed ${
        escuro ? 'text-papel-100/90' : 'text-tinta-700'
      }`}
    >
      {texto}
    </p>
  )
}
