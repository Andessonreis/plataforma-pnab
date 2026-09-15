import { prisma } from '@/lib/db'
import type { EditalStatus } from '@prisma/client'

const STATUS_COM_RESULTADO_PUBLICADO: EditalStatus[] = ['RESULTADO_PRELIMINAR', 'RECURSO', 'RESULTADO_FINAL']

/**
 * Mesmo critério que a tela de resultados usa pra saber se o preliminar (ou
 * fase posterior) já foi publicado: `edital.status` sozinho não basta porque
 * o scheduler avança a fase por data, sem checar se a Secretaria consolidou
 * algo (ver `result-actions.tsx`) — só conta como publicado quando também há
 * nota gravada em pelo menos uma inscrição do edital.
 */
export async function resultadoPreliminarConsolidado(
  editalId: string,
  editalStatus: EditalStatus,
): Promise<boolean> {
  if (!STATUS_COM_RESULTADO_PUBLICADO.includes(editalStatus)) return false
  const count = await prisma.inscricao.count({ where: { editalId, notaFinal: { not: null } } })
  return count > 0
}
