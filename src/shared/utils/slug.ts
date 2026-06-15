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

/**
 * Resolve colisão de slug: se `exists(base)` for verdadeiro, sufixa o slug
 * com um timestamp em base36 para garantir unicidade. O callback `exists`
 * encapsula a consulta de cada módulo (incluindo o caso update, que exclui
 * o próprio id da checagem).
 */
export async function ensureUniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean> | boolean,
): Promise<string> {
  if (await exists(base)) {
    return `${base}-${Date.now().toString(36)}`
  }
  return base
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
