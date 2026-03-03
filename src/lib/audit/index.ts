import { prisma } from '@/lib/db'

// ─────────────────────────────────────────────────────────────────────────────
// Tipos e constantes
// ─────────────────────────────────────────────────────────────────────────────

/** Ações auditáveis — mantém consistência nos filtros da UI */
export const AUDIT_ACTIONS = {
  // Autenticação
  LOGIN: 'LOGIN',
  LOGIN_FALHA: 'LOGIN_FALHA',
  LOGOUT: 'LOGOUT',
  CADASTRO: 'CADASTRO',
  SENHA_RESET_SOLICITADO: 'SENHA_RESET_SOLICITADO',
  SENHA_RESET_CONCLUIDO: 'SENHA_RESET_CONCLUIDO',

  // Proponente
  PERFIL_ATUALIZADO: 'PERFIL_ATUALIZADO',
  INSCRICAO_CRIADA: 'INSCRICAO_CRIADA',
  INSCRICAO_ENVIADA: 'INSCRICAO_ENVIADA',

  // Admin — editais
  EDITAL_CRIADO: 'EDITAL_CRIADO',
  EDITAL_ATUALIZADO: 'EDITAL_ATUALIZADO',
  EDITAL_PUBLICADO: 'EDITAL_PUBLICADO',

  // Admin — habilitação / avaliação
  INSCRICAO_HABILITADA: 'INSCRICAO_HABILITADA',
  INSCRICAO_INABILITADA: 'INSCRICAO_INABILITADA',
  STATUS_ALTERADO: 'STATUS_ALTERADO',

  // Admin — conteúdo
  NOTICIA_CRIADA: 'NOTICIA_CRIADA',
  NOTICIA_ATUALIZADA: 'NOTICIA_ATUALIZADA',
  NOTICIA_EXCLUIDA: 'NOTICIA_EXCLUIDA',
  CMS_PAGINA_CRIADA: 'CMS_PAGINA_CRIADA',
  CMS_PAGINA_ATUALIZADA: 'CMS_PAGINA_ATUALIZADA',
  CMS_PAGINA_EXCLUIDA: 'CMS_PAGINA_EXCLUIDA',
  FAQ_CRIADO: 'FAQ_CRIADO',
  FAQ_ATUALIZADO: 'FAQ_ATUALIZADO',
  FAQ_EXCLUIDO: 'FAQ_EXCLUIDO',

  // Admin — dados
  EXPORTACAO_CSV: 'EXPORTACAO_CSV',
  IMPORTACAO_CONTEMPLADOS: 'IMPORTACAO_CONTEMPLADOS',
} as const

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS]

interface LogAuditParams {
  userId?: string
  action: AuditAction | string
  entity?: string
  entityId?: string
  details?: Record<string, unknown>
  ip?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Registro de log
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Registra uma entrada no log de auditoria.
 * Nunca loga tokens, senhas ou PII sensível.
 */
export async function logAudit(params: LogAuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        entity: params.entity ?? null,
        entityId: params.entityId ?? null,
        details: (params.details as Record<string, string | number | boolean | null>) ?? undefined,
        ip: params.ip ?? null,
      },
    })
  } catch (err) {
    // Auditoria não deve quebrar o fluxo principal
    console.error('[audit] Falha ao registrar log:', err instanceof Error ? err.message : 'Unknown')
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Retenção — limpeza de logs antigos
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Dias de retenção — configurável via env AUDIT_RETENTION_DAYS (padrão: 365).
 */
function getRetentionDays(): number {
  const env = process.env.AUDIT_RETENTION_DAYS
  if (env) {
    const parsed = parseInt(env, 10)
    if (!isNaN(parsed) && parsed > 0) return parsed
  }
  return 365
}

/**
 * Remove logs de auditoria mais antigos que o período de retenção.
 * Retorna a quantidade de registros removidos.
 *
 * Pode ser chamado:
 * - Via cron job / BullMQ worker (recomendado)
 * - Manualmente pela API admin
 */
export async function purgeOldAuditLogs(): Promise<number> {
  const retentionDays = getRetentionDays()
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

  try {
    const result = await prisma.auditLog.deleteMany({
      where: { createdAt: { lt: cutoffDate } },
    })

    console.log(
      `[audit] Purge concluído: ${result.count} log(s) removido(s) (retenção: ${retentionDays} dias)`,
    )

    return result.count
  } catch (err) {
    console.error('[audit] Falha na purge:', err instanceof Error ? err.message : 'Unknown')
    return 0
  }
}
