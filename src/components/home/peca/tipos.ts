import type { PecaInput } from '@/lib/schemas/slide-destaque'

/**
 * Conteúdo da peça editorial já pronto para a abertura: o que o admin grava em
 * `SlideDestaque.peca`, mais o texto de apoio e o fundo, que moram nas colunas
 * comuns do slide (`descricao` e `imagemUrl`).
 */
export type PecaEditorial = PecaInput & {
  apoio: string | null
  fundo: string
}

/**
 * Link externo colado no admin não está na lista de domínios do otimizador de
 * imagens do Next (e não tem como estar); esses vão direto, sem otimização.
 */
export const imagemExterna = (url: string) => /^https?:\/\//.test(url)
