// Mapa de variantes de badge para tipos de documento (edital + proponente)
// Cobre os tipos legados (PDF, ANEXO...) e os novos (PDF_EDITAL, ANEXO_EDITAL...)

type BadgeVariant = 'success' | 'warning' | 'info' | 'neutral' | 'error'

const KNOWN_VARIANTS: Record<string, BadgeVariant> = {
  // Tipos legados (seção 7 — documentos do edital)
  PDF: 'error',
  ANEXO: 'info',
  MODELO: 'neutral',
  PLANILHA: 'success',
  DECLARACAO: 'warning',
  // Novos slugs unificados
  PDF_EDITAL: 'error',
  ANEXO_EDITAL: 'info',
  MODELO_EDITAL: 'neutral',
  PLANILHA_EDITAL: 'success',
  DECLARACAO_EDITAL: 'warning',
  // Tipos de anexo do proponente
  DOCUMENTO_PESSOAL: 'info',
  COMPROVANTE_ENDERECO: 'success',
  PORTFOLIO: 'neutral',
  PROJETO: 'warning',
  ORCAMENTO: 'error',
  OUTRO: 'neutral',
}

const VARIANT_POOL: BadgeVariant[] = ['success', 'warning', 'info', 'neutral', 'error']

/** Hash simples e determinístico para tipos dinâmicos criados pelo admin */
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

/**
 * Retorna a variante de badge para um tipo de documento.
 * Usa mapa fixo para tipos conhecidos e hash determinístico para tipos dinâmicos.
 */
export function getBadgeVariantForTipo(tipo: string): BadgeVariant {
  const upper = tipo.toUpperCase()
  if (upper in KNOWN_VARIANTS) return KNOWN_VARIANTS[upper]
  return VARIANT_POOL[hashString(upper) % VARIANT_POOL.length]
}
