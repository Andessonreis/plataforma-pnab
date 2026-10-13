/** Upload de imagens do Memorial: rota, pastas aceitas e limite (painel e API usam os mesmos). */
export const UPLOAD_MEMORIAL = '/api/v1/memorial/upload'

export const PASTAS_UPLOAD_MEMORIAL = ['acervo', 'exposicoes', 'pessoas'] as const
export type PastaUploadMemorial = (typeof PASTAS_UPLOAD_MEMORIAL)[number]

/** Fotografia histórica digitalizada costuma ser bem maior que uma foto de notícia. */
export const MAX_BYTES_MEMORIAL = 15 * 1024 * 1024
export const megabytesMemorial = MAX_BYTES_MEMORIAL / 1024 / 1024

/** Imagem a exibir de um item: a versão leve para a web, se houver, senão o original. */
export function imagemDoItem(item: { versaoWebUrl: string | null; arquivoUrl: string | null }): string | null {
  return item.versaoWebUrl ?? item.arquivoUrl
}
