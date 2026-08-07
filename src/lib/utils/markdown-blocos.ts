import { slugify } from './slug'

// ─────────────────────────────────────────────────────────────────────────────
// Markdown do admin (notícias, CMS): superfície pequena e conhecida — negrito,
// itálico, código inline, link, heading ##/###, citação, lista. Não precisa de
// AST completa. Ponto único de verdade: antes havia limpeza divergente em
// `consulta.ts` (chamada de listagem, cobria blocos+inline) e um parser
// linha-a-linha no detalhe (só removia `# * _ \``, deixava link/imagem/citação
// vazarem para meta description e OG).
// ─────────────────────────────────────────────────────────────────────────────

export interface NoticiaHeading {
  id: string
  text: string
  level: 2 | 3
}

/**
 * Tira toda a marcação do corpo, para chamada de capa ou meta description/OG.
 * Sem `limite`, devolve o texto limpo inteiro.
 */
export function stripMarkdown(corpo: string, limite?: number): string {
  const limpo = corpo
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/[*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (limite === undefined || limpo.length <= limite) return limpo
  const corte = limpo.slice(0, limite)
  const ultimoEspaco = corte.lastIndexOf(' ')
  return (ultimoEspaco > 0 ? corte.slice(0, ultimoEspaco) : corte) + '...'
}

/**
 * Headings `##`/`###` do corpo, com id de âncora único (heading repetido
 * ganha sufixo `-2`, `-3`...). `renderMarkdown` consome a mesma lista, na
 * mesma ordem, para que os `id` dos elementos batam com essas âncoras.
 */
export function extractHeadings(corpo: string): NoticiaHeading[] {
  const usados = new Map<string, number>()
  const headings: NoticiaHeading[] = []

  for (const linha of corpo.split('\n')) {
    const match = /^(#{2,3})\s+(.+)$/.exec(linha.trim())
    if (!match) continue

    const level = match[1].length as 2 | 3
    const text = match[2].trim()
    const base = slugify(text) || 'secao'
    const repeticoes = usados.get(base) ?? 0
    usados.set(base, repeticoes + 1)

    headings.push({ id: repeticoes === 0 ? base : `${base}-${repeticoes + 1}`, text, level })
  }

  return headings
}

// ── Blocos ───────────────────────────────────────────────────────────────────

export type Bloco =
  | { tipo: 'heading'; nivel: 2 | 3; texto: string }
  | { tipo: 'lista'; ordenada: boolean; itens: string[] }
  | { tipo: 'citacao'; linhas: string[] }
  | { tipo: 'paragrafo'; texto: string }

const RE_HEADING = /^(#{2,3})\s+(.+)$/
const RE_CITACAO = /^>\s?/
const RE_ITEM_ORDENADO = /^\d+\.\s+/
const RE_ITEM_NAO_ORDENADO = /^[-*+]\s+/

export function agruparBlocos(corpo: string): Bloco[] {
  const linhas = corpo.split('\n')
  const blocos: Bloco[] = []
  let i = 0

  while (i < linhas.length) {
    const trimmed = linhas[i].trim()

    if (!trimmed) {
      i++
      continue
    }

    const heading = RE_HEADING.exec(trimmed)
    if (heading) {
      blocos.push({ tipo: 'heading', nivel: heading[1].length as 2 | 3, texto: heading[2].trim() })
      i++
      continue
    }

    if (RE_CITACAO.test(trimmed)) {
      const linhasCitacao: string[] = []
      while (i < linhas.length && RE_CITACAO.test(linhas[i].trim())) {
        linhasCitacao.push(linhas[i].trim().replace(RE_CITACAO, ''))
        i++
      }
      blocos.push({ tipo: 'citacao', linhas: linhasCitacao })
      continue
    }

    const ordenada = RE_ITEM_ORDENADO.test(trimmed)
    const naoOrdenada = RE_ITEM_NAO_ORDENADO.test(trimmed)
    if (ordenada || naoOrdenada) {
      const re = ordenada ? RE_ITEM_ORDENADO : RE_ITEM_NAO_ORDENADO
      const itens: string[] = []
      while (i < linhas.length && re.test(linhas[i].trim())) {
        itens.push(linhas[i].trim().replace(re, ''))
        i++
      }
      blocos.push({ tipo: 'lista', ordenada, itens })
      continue
    }

    // Parágrafo: acumula linhas até topar com linha em branco ou outro bloco.
    const linhasParagrafo: string[] = []
    while (
      i < linhas.length &&
      linhas[i].trim() &&
      !RE_HEADING.test(linhas[i].trim()) &&
      !RE_CITACAO.test(linhas[i].trim()) &&
      !RE_ITEM_ORDENADO.test(linhas[i].trim()) &&
      !RE_ITEM_NAO_ORDENADO.test(linhas[i].trim())
    ) {
      linhasParagrafo.push(linhas[i].trim())
      i++
    }
    blocos.push({ tipo: 'paragrafo', texto: linhasParagrafo.join(' ') })
  }

  return blocos
}
