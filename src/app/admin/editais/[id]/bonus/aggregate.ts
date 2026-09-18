import type { ResultadoInscricao } from '@/lib/results/calculate'
import type { CategoriaConfig } from '@/types/categoria-config'
import type { ItensBonusConfig } from '@/types/bonus-config'
import { encontrarCategoriaConfig } from '@/lib/results/bonus'

export interface LinhaBonus {
  inscricaoId: string
  numero: string
  proponenteNome: string
  categoria: string | null
  /** De onde vieram os pontos: itens de bonificação do edital ou cotas autodeclaradas. */
  itens: { key: string; label: string; pontos: number }[]
  notaBase: number
  notaBonus: number
  notaComBonus: number
}

export interface BonusAgregado {
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
 *
 * A origem dos pontos acompanha a do cálculo (ver `calculateResults`): edital
 * com `itensBonus` mostra o que a comissão validou; os demais, a cota
 * autodeclarada.
 */
export function montarLinhasBonus(
  resultados: ResultadoInscricao[],
  categoriasConfig: CategoriaConfig[] | null,
  itensBonus?: ItensBonusConfig | null,
): LinhaBonus[] {
  return resultados
    .filter((r) => r.notaBonus > 0)
    .map((r) => {
      const config = encontrarCategoriaConfig(categoriasConfig, r.categoria)
      const origem = itensBonus
        ? (r.bonusItens ?? []).map((key) => {
            const item = itensBonus.itens.find((i) => i.key === key)
            return item ? { key, label: item.label, pontos: item.pontos } : null
          })
        : (r.cotasOptIn ?? []).map((key) => {
            const cota = config?.cotas.find((c) => c.key === key)
            const pontos = cota?.pontosBonus ?? 0
            return pontos > 0 ? { key, label: cota?.label ?? key, pontos } : null
          })
      const itens = origem.filter((c): c is { key: string; label: string; pontos: number } => c !== null)

      return {
        inscricaoId: r.inscricaoId,
        numero: r.numero ?? '',
        proponenteNome: r.proponenteNome,
        categoria: r.categoria,
        itens,
        notaBase: Math.round((r.notaFinal - r.notaBonus) * 100) / 100,
        notaBonus: r.notaBonus,
        notaComBonus: r.notaFinal,
      }
    })
    .sort((a, b) => b.notaBonus - a.notaBonus)
}

/** Soma pontos e conta inscrições por item de bonificação, pro gráfico de barras. */
export function agregarPorItem(linhas: LinhaBonus[]): BonusAgregado[] {
  const map = new Map<string, BonusAgregado>()
  for (const linha of linhas) {
    for (const item of linha.itens) {
      const atual = map.get(item.key) ?? { key: item.key, label: item.label, inscricoes: 0, totalPontos: 0 }
      atual.inscricoes += 1
      atual.totalPontos = Math.round((atual.totalPontos + item.pontos) * 100) / 100
      map.set(item.key, atual)
    }
  }
  return Array.from(map.values()).sort((a, b) => b.totalPontos - a.totalPontos)
}
