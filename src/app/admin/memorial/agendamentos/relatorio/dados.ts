import { relatorioVisitas } from '@/lib/services/memorial-agendamento-relatorio.service'
import { periodoAnterior } from './calculos'

/**
 * Período pedido e o imediatamente anterior, lado a lado. É a mesma consulta da tela
 * e do PDF, para que os dois nunca mostrem números diferentes.
 */
export async function relatorioComparado(de: string, ate: string) {
  const antes = periodoAnterior(de, ate)
  const [atual, anterior] = await Promise.all([relatorioVisitas(de, ate), relatorioVisitas(antes.de, antes.ate)])
  return { de, ate, atual, anterior, periodoAnterior: antes }
}

export type RelatorioComparado = Awaited<ReturnType<typeof relatorioComparado>>
