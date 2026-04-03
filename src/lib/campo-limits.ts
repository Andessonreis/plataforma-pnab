// Limites de caracteres padrão por tipo de campo dinâmico
export const CHAR_LIMIT_DEFAULTS: Record<string, { minLength: number; maxLength: number }> = {
  texto:    { minLength: 0, maxLength: 200 },
  text:     { minLength: 0, maxLength: 200 },
  textarea: { minLength: 0, maxLength: 2000 },
  numero:   { minLength: 0, maxLength: 20 },
  number:   { minLength: 0, maxLength: 20 },
}

// Tipos de campo que suportam limite de caracteres
export const CHAR_LIMIT_TYPES = new Set(['texto', 'text', 'textarea', 'numero', 'number'])

/**
 * Resolve os limites de caracteres para um campo, usando valores
 * explícitos quando definidos ou defaults por tipo.
 * Retorna null para tipos que não suportam limites (select, data, arquivo, moeda).
 */
export function resolveCharLimits(campo: {
  tipo: string
  minLength?: number | null
  maxLength?: number | null
}): { minLength: number; maxLength: number } | null {
  if (!CHAR_LIMIT_TYPES.has(campo.tipo)) return null

  const defaults = CHAR_LIMIT_DEFAULTS[campo.tipo] ?? { minLength: 0, maxLength: 200 }

  return {
    minLength: campo.minLength ?? defaults.minLength,
    maxLength: campo.maxLength ?? defaults.maxLength,
  }
}
