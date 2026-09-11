import type { ResultadoInscricao } from '@/lib/results/calculate'
import type { CategoriaConfig } from '@/types/categoria-config'
import { encontrarCategoriaConfig } from '@/lib/results/bonus'

export interface LinhaBonus {
  inscricaoId: string
  numero: string
  proponenteNome: string
  categoria: string | null
  cotas: { key: string; label: string; pontos: number }[]
  notaBase: number
  notaBonus: number
  notaComBonus: number
}

export interface CotaAgregada {
  key: string
  label: string
  inscricoes: number
  totalPontos: number
}

/**
 * Monta as linhas do painel de bônus a partir do resultado já calculado com
 * `incluirBonus: true` — só entram inscrições com bônus > 0. `notaBase`
 * (média dos avaliadores, sem bônus) é derivada subtraindo o bônus de
 * `notaFinal`, já que `calculateResults` soma os dois quando a opção é usada.
 */
export function montarLinhasBonus(
  resultados: ResultadoInscricao[],
  categoriasConfig: CategoriaConfig[] | null,
): LinhaBonus[] {
  return resultados
    .filter((r) => r.notaBonus > 0)
    .map((r) => {
      const config = encontrarCategoriaConfig(categoriasConfig, r.categoria)
      const cotas = (r.cotasOptIn ?? [])
        .map((key) => {
          const cota = config?.cotas.find((c) => c.key === key)
          const pontos = cota?.pontosBonus ?? 0
          return pontos > 0 ? { key, label: cota?.label ?? key, pontos } : null
        })
        .filter((c): c is { key: string; label: string; pontos: number } => c !== null)

      return {
        inscricaoId: r.inscricaoId,
        numero: r.numero ?? '',
        proponenteNome: r.proponenteNome,
        categoria: r.categoria,
        cotas,
        notaBase: Math.round((r.notaFinal - r.notaBonus) * 100) / 100,
        notaBonus: r.notaBonus,
        notaComBonus: r.notaFinal,
      }
    })
    .sort((a, b) => b.notaBonus - a.notaBonus)
}

/** Soma pontos e conta inscrições por cota, pro gráfico de barras. */
export function agregarPorCota(linhas: LinhaBonus[]): CotaAgregada[] {
  const map = new Map<string, CotaAgregada>()
  for (const linha of linhas) {
    for (const cota of linha.cotas) {
      const atual = map.get(cota.key) ?? { key: cota.key, label: cota.label, inscricoes: 0, totalPontos: 0 }
      atual.inscricoes += 1
      atual.totalPontos = Math.round((atual.totalPontos + cota.pontos) * 100) / 100
      map.set(cota.key, atual)
    }
  }
  return Array.from(map.values()).sort((a, b) => b.totalPontos - a.totalPontos)
}
