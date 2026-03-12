import type { EditalStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { TRANSICOES_MANUAIS } from '@/types/cronograma'
import { enqueueEmail } from '@/lib/queue'

export interface AvancarFaseResult {
  ok: boolean
  novoStatus?: EditalStatus
  error?: string
  pendencias?: { enviadas: number }
}

const FASE_LABELS: Record<string, string> = {
  HABILITACAO: 'Habilitação',
  AVALIACAO: 'Avaliação',
  RESULTADO_PRELIMINAR: 'Resultado Preliminar',
  RECURSO: 'Recursos',
  RESULTADO_FINAL: 'Resultado Final',
  ENCERRADO: 'Encerrado',
}

/**
 * Retorna a próxima fase manual válida para o status atual do edital.
 */
export function getProximaFaseManual(statusAtual: EditalStatus): EditalStatus | null {
  for (const [fase, transicao] of Object.entries(TRANSICOES_MANUAIS)) {
    if (transicao.de === statusAtual) return fase as EditalStatus
  }
  return null
}

/**
 * Verifica pendências que impedem o avanço de fase.
 */
async function verificarPendencias(
  editalId: string,
  statusAtual: EditalStatus,
  novaFase: EditalStatus,
): Promise<AvancarFaseResult | null> {
  // HABILITACAO → AVALIACAO: bloqueia se há inscrições ENVIADA pendentes
  if (statusAtual === 'HABILITACAO' && novaFase === 'AVALIACAO') {
    const enviadas = await prisma.inscricao.count({
      where: { editalId, status: 'ENVIADA' },
    })
    if (enviadas > 0) {
      return {
        ok: false,
        error: `Ainda há ${enviadas} inscrição(ões) com status ENVIADA que precisam ser habilitadas ou inabilitadas.`,
        pendencias: { enviadas },
      }
    }
  }

  return null
}

/**
 * Executa a lógica batch ao avançar de fase.
 */
async function executarBatchTransicao(
  editalId: string,
  novaFase: EditalStatus,
): Promise<void> {
  // HABILITACAO → AVALIACAO: move HABILITADA → EM_AVALIACAO
  if (novaFase === 'AVALIACAO') {
    await prisma.inscricao.updateMany({
      where: { editalId, status: 'HABILITADA' },
      data: { status: 'EM_AVALIACAO' },
    })
  }

  // RESULTADO_PRELIMINAR → RECURSO: abre prazo de recurso
  if (novaFase === 'RECURSO') {
    await prisma.inscricao.updateMany({
      where: { editalId, status: 'RESULTADO_PRELIMINAR' },
      data: { status: 'RECURSO_ABERTO' },
    })
  }
}

/**
 * Avança o edital para a próxima fase manual.
 */
export async function avancarFaseEdital(
  editalId: string,
  userId: string,
  ip?: string,
): Promise<AvancarFaseResult> {
  const edital = await prisma.edital.findUnique({
    where: { id: editalId },
    select: { id: true, titulo: true, status: true },
  })

  if (!edital) return { ok: false, error: 'Edital não encontrado.' }

  const novaFase = getProximaFaseManual(edital.status)
  if (!novaFase) {
    return { ok: false, error: `Não há próxima fase manual para o status "${edital.status}".` }
  }

  // Verificar pendências
  const bloqueio = await verificarPendencias(editalId, edital.status, novaFase)
  if (bloqueio) return bloqueio

  // Executar batch (ex: HABILITADA → EM_AVALIACAO)
  await executarBatchTransicao(editalId, novaFase)

  // Atualizar status do edital
  await prisma.edital.update({
    where: { id: editalId },
    data: { status: novaFase },
  })

  await logAudit({
    userId,
    action: 'FASE_AVANCADA',
    entity: 'Edital',
    entityId: editalId,
    details: {
      titulo: edital.titulo,
      statusAnterior: edital.status,
      novoStatus: novaFase,
      manual: true,
    },
    ip,
  })

  console.log(
    `[Admin] Edital "${edital.titulo}": ${edital.status} → ${novaFase} (manual por ${userId})`,
  )

  return { ok: true, novoStatus: novaFase }
}

/**
 * Retorna informações de pré-voo para o avanço de fase.
 */
export async function getPreFlightInfo(editalId: string) {
  const edital = await prisma.edital.findUnique({
    where: { id: editalId },
    select: { id: true, titulo: true, status: true },
  })

  if (!edital) return null

  const proximaFase = getProximaFaseManual(edital.status)
  if (!proximaFase) return { edital, proximaFase: null, label: null, pendencias: null }

  // Contar pendências por status
  const counts = await prisma.inscricao.groupBy({
    by: ['status'],
    where: { editalId },
    _count: true,
  })

  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count]))

  return {
    edital,
    proximaFase,
    label: FASE_LABELS[proximaFase] ?? proximaFase,
    pendencias: countMap,
  }
}
