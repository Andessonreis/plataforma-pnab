// ─────────────────────────────────────────────────────────────────────────────
// Geração de slugs — utilitário compartilhado
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Gera slug a partir de texto, removendo acentos e caracteres especiais.
 */
function slugify(text: string): string {
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
