// ─────────────────────────────────────────────────────────────────────────────
// Geração de slugs — utilitário compartilhado
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Gera slug a partir de texto, removendo acentos e caracteres especiais.
 * Compartilhado entre slugs de conteúdo (abaixo) e âncoras de heading
 * (`extractHeadings` em `lib/utils/markdown.tsx`).
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/**
 * Slug para editais: `titulo-ano`
 */
export function generateEditalSlug(titulo: string, ano: number): string {
  return `${slugify(titulo)}-${ano}`
}

/**
 * Slug para notícias e CMS: `titulo-timestamp`
 */
export function generateContentSlug(titulo: string): string {
  return `${slugify(titulo)}-${Date.now().toString(36)}`
}

/**
 * Slug simples (para CMS pages que não precisam de timestamp).
 */
export function generateSimpleSlug(titulo: string): string {
  return slugify(titulo)
}

/**
 * Gera identificador UPPER_SNAKE_CASE a partir de um label.
 * Ex: "Certidão Negativa de Débitos" → "CERTIDAO_NEGATIVA_DE_DEBITOS"
 */
export function generateTipoSlug(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^A-Z0-9_]/g, '')
    .replace(/^_+|_+$/g, '')
}

/**
 * Gera identificador snake_case a partir de um label, para usar como `nome`
 * t\u00e9cnico de campo de formul\u00e1rio. Ex: "Nome do Projeto" \u2192 "nome_do_projeto".
 */
export function generateFieldName(label: string): string {
  const slug = label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48)
  return slug || `campo_${Date.now().toString(36).slice(-4)}`
}
