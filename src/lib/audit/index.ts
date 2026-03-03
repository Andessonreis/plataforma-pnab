import { prisma } from '@/lib/db'

interface LogAuditParams {
  userId?: string
  action: string
  entity?: string
  entityId?: string
  details?: Record<string, unknown>
  ip?: string
}

/**
 * Registra uma entrada no log de auditoria.
 * Nunca loga tokens, senhas ou PII sensivel.
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
    // Auditoria nao deve quebrar o fluxo principal
    console.error('[audit] Falha ao registrar log:', err instanceof Error ? err.message : 'Unknown')
  }
}
