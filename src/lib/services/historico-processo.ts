import { prisma } from '@/lib/db'

/**
 * Histórico do processo de uma inscrição (somente leitura).
 *
 * Reúne os eventos de auditoria que descrevem o que aconteceu com a inscrição
 * nas fases de habilitação e avaliação, montando uma linha do tempo legível
 * para o ADMIN acompanhar o processo.
 *
 * ⚠️ Avaliação é cega entre avaliadores — esta visão expõe quem finalizou e
 * com qual nota, portanto deve ser usada APENAS em telas restritas ao ADMIN.
 */

export interface EventoHistorico {
  id: string
  action: string
  createdAt: Date
  ator: { nome: string; role: string } | null
  details: Record<string, unknown> | null
}

/** Ações que compõem a linha do tempo do processo (habilitação + avaliação) */
const ACOES_PROCESSO = [
  'INSCRICAO_ENVIADA',
  'INSCRICAO_HABILITADA',
  'INSCRICAO_INABILITADA',
  'AVALIADOR_ATRIBUIDO',
  'AVALIADOR_REMOVIDO',
  'AVALIACAO_RASCUNHO_SALVO',
  'AVALIACAO_FINALIZADA',
  'HABILITACAO_FORA_DA_FASE_BLOQUEADA',
  'AVALIACAO_FORA_DA_FASE_BLOQUEADA',
  'AVALIADOR_ATRIBUIDO_FORA_DA_FASE_BLOQUEADO',
  'RECURSO_SUBMETIDO',
  'RECURSO_DECIDIDO',
  'RESULTADO_PRELIMINAR_PUBLICADO',
  'RESULTADO_FINAL_PUBLICADO',
]

export async function getHistoricoProcesso(inscricaoId: string): Promise<EventoHistorico[]> {
  // As avaliações são auditadas com entity='Avaliacao' (entityId = id da avaliação),
  // enquanto habilitação/atribuição usam entity='Inscricao'. Juntamos os dois.
  const avaliacoes = await prisma.avaliacao.findMany({
    where: { inscricaoId },
    select: { id: true },
  })
  const avaliacaoIds = avaliacoes.map((a) => a.id)

  const logs = await prisma.auditLog.findMany({
    where: {
      action: { in: ACOES_PROCESSO },
      OR: [
        { entity: 'Inscricao', entityId: inscricaoId },
        ...(avaliacaoIds.length > 0
          ? [{ entity: 'Avaliacao', entityId: { in: avaliacaoIds } }]
          : []),
      ],
    },
    orderBy: { createdAt: 'asc' },
    include: { user: { select: { nome: true, role: true } } },
  })

  return logs.map((l) => ({
    id: l.id,
    action: l.action,
    createdAt: l.createdAt,
    ator: l.user ? { nome: l.user.nome, role: l.user.role } : null,
    details: (l.details as Record<string, unknown> | null) ?? null,
  }))
}
