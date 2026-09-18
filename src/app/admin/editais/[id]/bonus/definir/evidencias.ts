import type { CategoriaConfig } from '@/types/categoria-config'

export interface InscricaoEvidencia {
  categoria: string | null
  cotasOptIn: string[]
  campos: Record<string, unknown>
}

/**
 * O que o proponente declarou na inscrição, para a comissão conferir contra as
 * autodeclarações anexadas antes de marcar a bonificação.
 *
 * Deliberadamente NÃO usa o que os pareceristas marcaram: o bônus é fato
 * documental, e a leitura de cada parecerista sobre isso é justamente o que
 * fazia a mesma pessoa receber bônus diferente em propostas diferentes.
 */
export function evidenciasDaInscricao(
  inscricao: InscricaoEvidencia,
  categoriasConfig: CategoriaConfig[] | null,
): string[] {
  const evidencias: string[] = []

  const config = categoriasConfig?.find((c) => c.nome === inscricao.categoria)
  for (const key of inscricao.cotasOptIn) {
    const label = config?.cotas.find((c) => c.key === key)?.label ?? key
    evidencias.push(`Cota: ${label}`)
  }

  const lgbtqia = inscricao.campos.pessoa_lgbtqia
  if (typeof lgbtqia === 'string' && lgbtqia.trim()) {
    evidencias.push(`Pessoa LGBTQIA+: ${lgbtqia}`)
  }

  return evidencias
}
