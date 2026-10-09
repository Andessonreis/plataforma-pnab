import type { MemorialTipoAcervo } from '@prisma/client'

/** Item do acervo como chega do servidor para edição. */
export interface ItemEditavel {
  id: string
  tipo: MemorialTipoAcervo
  titulo: string
  legenda: string | null
  descricao: string | null
  contextoHistorico: string | null
  dataAproximada: string | null
  decada: number | null
  local: string | null
  autor: string | null
  fotografo: string | null
  fonte: string | null
  credito: string | null
  direitosUso: string | null
  autorizado: boolean
  arquivoUrl: string | null
  versaoWebUrl: string | null
  fotoAtualUrl: string | null
  tags: string[]
  albumId: string | null
  exposicoes: { id: string }[]
  pessoas: { id: string }[]
  eventos: { id: string }[]
}

/** Estado do formulário: números e listas como texto, do jeito que se digita. */
export function valoresIniciais(item?: ItemEditavel) {
  return {
    tipo: item?.tipo ?? ('FOTOGRAFIA' as MemorialTipoAcervo),
    titulo: item?.titulo ?? '',
    legenda: item?.legenda ?? '',
    descricao: item?.descricao ?? '',
    contextoHistorico: item?.contextoHistorico ?? '',
    dataAproximada: item?.dataAproximada ?? '',
    decada: item?.decada ? String(item.decada) : '',
    local: item?.local ?? '',
    autor: item?.autor ?? '',
    fotografo: item?.fotografo ?? '',
    fonte: item?.fonte ?? '',
    credito: item?.credito ?? '',
    direitosUso: item?.direitosUso ?? '',
    autorizado: item?.autorizado ?? false,
    arquivoUrl: item?.arquivoUrl ?? null,
    versaoWebUrl: item?.versaoWebUrl ?? null,
    fotoAtualUrl: item?.fotoAtualUrl ?? null,
    tags: item?.tags.join(', ') ?? '',
    albumId: item?.albumId ?? '',
    exposicaoIds: item?.exposicoes.map((e) => e.id) ?? [],
    pessoaIds: item?.pessoas.map((p) => p.id) ?? [],
    eventoIds: item?.eventos.map((e) => e.id) ?? [],
  }
}

export type ValoresItem = ReturnType<typeof valoresIniciais>

/** Converte o estado do formulário no corpo esperado pela API. */
export function corpoDoItem(v: ValoresItem) {
  return {
    ...v,
    decada: v.decada ? Number(v.decada) : null,
    tags: v.tags.split(',').map((t) => t.trim()).filter(Boolean),
  }
}

/** Props que as seções do formulário recebem de `useCampos`. */
export interface SecaoItemProps {
  valores: ValoresItem
  definir: <K extends keyof ValoresItem>(campo: K, valor: ValoresItem[K]) => void
  texto: <K extends keyof ValoresItem>(campo: K) => { value: string; onChange: (e: { target: { value: string } }) => void }
  erros: Record<string, string>
}
