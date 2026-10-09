/** Exposição como chega do servidor para edição. */
export interface ExposicaoEditavel {
  id: string
  titulo: string
  slug: string
  subtitulo: string | null
  descricao: string | null
  periodo: string | null
  localizacao: string | null
  capaUrl: string | null
  dataInicio: Date | null
  dataFim: Date | null
  destaque: boolean
  ordem: number
  itens: { id: string }[]
  pessoas: { id: string }[]
  eventos: { id: string }[]
}

const dia = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : '')

/** Estado do formulário; datas como "aaaa-mm-dd", do jeito que o campo de data usa. */
export function valoresExposicao(e?: ExposicaoEditavel) {
  return {
    titulo: e?.titulo ?? '',
    slug: e?.slug ?? '',
    subtitulo: e?.subtitulo ?? '',
    descricao: e?.descricao ?? '',
    periodo: e?.periodo ?? '',
    localizacao: e?.localizacao ?? '',
    capaUrl: e?.capaUrl ?? null,
    dataInicio: dia(e?.dataInicio ?? null),
    dataFim: dia(e?.dataFim ?? null),
    destaque: e?.destaque ?? false,
    ordem: e?.ordem ?? 0,
    itemIds: e?.itens.map((i) => i.id) ?? [],
    pessoaIds: e?.pessoas.map((p) => p.id) ?? [],
    eventoIds: e?.eventos.map((v) => v.id) ?? [],
  }
}

export type ValoresExposicao = ReturnType<typeof valoresExposicao>

/** Props que as seções do formulário recebem de `useCampos`. */
export interface SecaoExposicaoProps {
  valores: ValoresExposicao
  definir: <K extends keyof ValoresExposicao>(campo: K, valor: ValoresExposicao[K]) => void
  texto: <K extends keyof ValoresExposicao>(campo: K) => { value: string; onChange: (e: { target: { value: string } }) => void }
  erros: Record<string, string>
}
