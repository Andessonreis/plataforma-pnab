interface Bloco {
  titulo?: string
  paragrafos: string[]
  itens: string[]
}

/**
 * O regulamento é texto simples editado no painel: cada bloco separado por linha em
 * branco, a primeira linha sem "- " vira o título e as linhas com "- " viram itens.
 */
function emBlocos(texto: string): Bloco[] {
  return texto
    .split(/\n\s*\n/)
    .map((trecho) => trecho.split('\n').map((l) => l.trim()).filter(Boolean))
    .filter((linhas) => linhas.length > 0)
    .map((linhas) => {
      const itens = linhas.filter((l) => /^[-•*]\s+/.test(l)).map((l) => l.replace(/^[-•*]\s+/, ''))
      const resto = linhas.filter((l) => !/^[-•*]\s+/.test(l))
      const titulo = itens.length > 0 && resto.length > 0 ? resto.shift() : undefined
      return { titulo, paragrafos: resto, itens }
    })
}

/** Regulamento com títulos e listas, em medida de leitura confortável também no celular. */
export function TextoRegulamento({ texto, compacto }: { texto: string; compacto?: boolean }) {
  const tamanho = compacto ? 'text-sm' : 'text-[15px]'
  return (
    <div className={`max-w-prose space-y-5 leading-relaxed text-tinta-800 ${tamanho}`}>
      {emBlocos(texto).map((b, i) => (
        <section key={i}>
          {b.titulo && <h4 className="mb-2 font-semibold text-tinta-900">{b.titulo}</h4>}
          {b.paragrafos.map((p) => (
            <p key={p} className="mb-2">
              {p}
            </p>
          ))}
          {b.itens.length > 0 && (
            <ul className="space-y-1.5">
              {b.itens.map((item) => (
                <li key={item} className="flex gap-3">
                  <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 bg-oliva-700" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  )
}
