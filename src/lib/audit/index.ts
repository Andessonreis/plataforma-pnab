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
  ANEXO_ENVIADO: 'ANEXO_ENVIADO',

  // Admin — editais
  EDITAL_CRIADO: 'EDITAL_CRIADO',
  EDITAL_ATUALIZADO: 'EDITAL_ATUALIZADO',
  EDITAL_PUBLICADO: 'EDITAL_PUBLICADO',

  // Admin — habilitação / avaliação
  INSCRICAO_HABILITADA: 'INSCRICAO_HABILITADA',
  INSCRICAO_INABILITADA: 'INSCRICAO_INABILITADA',
  STATUS_ALTERADO: 'STATUS_ALTERADO',
  AVALIADOR_ATRIBUIDO: 'AVALIADOR_ATRIBUIDO',
  AVALIADOR_REMOVIDO: 'AVALIADOR_REMOVIDO',

  // Admin — equipe do edital
  MEMBRO_EDITAL_ADICIONADO: 'MEMBRO_EDITAL_ADICIONADO',
  MEMBRO_EDITAL_REMOVIDO: 'MEMBRO_EDITAL_REMOVIDO',

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

  // Admin — resultados
  RESULTADO_CALCULADO: 'RESULTADO_CALCULADO',
  RESULTADO_PRELIMINAR_PUBLICADO: 'RESULTADO_PRELIMINAR_PUBLICADO',
  RESULTADO_FINAL_PUBLICADO: 'RESULTADO_FINAL_PUBLICADO',

  // Recursos
  RECURSO_SUBMETIDO: 'RECURSO_SUBMETIDO',
  RECURSO_DECIDIDO: 'RECURSO_DECIDIDO',

  // Admin — tipos de anexo
  TIPO_ANEXO_CRIADO: 'TIPO_ANEXO_CRIADO',
  TIPO_ANEXO_ATUALIZADO: 'TIPO_ANEXO_ATUALIZADO',
  TIPO_ANEXO_EXCLUIDO: 'TIPO_ANEXO_EXCLUIDO',

  // Admin — categorias culturais
  CATEGORIA_CRIADA: 'CATEGORIA_CRIADA',
  CATEGORIA_ATUALIZADA: 'CATEGORIA_ATUALIZADA',
  CATEGORIA_EXCLUIDA: 'CATEGORIA_EXCLUIDA',
  CATEGORIAS_REORDENADAS: 'CATEGORIAS_REORDENADAS',

  // Admin — templates de avaliação
  TEMPLATE_AVALIACAO_CRIADO: 'TEMPLATE_AVALIACAO_CRIADO',
  TEMPLATE_AVALIACAO_ATUALIZADO: 'TEMPLATE_AVALIACAO_ATUALIZADO',
  TEMPLATE_AVALIACAO_EXCLUIDO: 'TEMPLATE_AVALIACAO_EXCLUIDO',

  // Admin — dados
  EXPORTACAO_CSV: 'EXPORTACAO_CSV',
  EXPORTACAO_LISTA_PDF: 'EXPORTACAO_LISTA_PDF',
  EXPORTACAO_RELATORIO_FINAL: 'EXPORTACAO_RELATORIO_FINAL',
  IMPORTACAO_CONTEMPLADOS: 'IMPORTACAO_CONTEMPLADOS',
} as const

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS]

/** Rótulos legíveis em português para cada ação */
export const ACTION_LABELS: Record<string, string> = {
  LOGIN: 'Login',
  LOGIN_FALHA: 'Login falho',
  LOGOUT: 'Logout',
  CADASTRO: 'Cadastro',
  SENHA_RESET_SOLICITADO: 'Reset senha (pedido)',
  SENHA_RESET_CONCLUIDO: 'Reset senha (concluído)',
  PERFIL_ATUALIZADO: 'Perfil atualizado',
  INSCRICAO_CRIADA: 'Inscrição criada',
  INSCRICAO_ENVIADA: 'Inscrição enviada',
  ANEXO_ENVIADO: 'Anexo enviado',
  EDITAL_CRIADO: 'Edital criado',
  EDITAL_ATUALIZADO: 'Edital atualizado',
  EDITAL_PUBLICADO: 'Edital publicado',
  INSCRICAO_HABILITADA: 'Habilitada',
  INSCRICAO_INABILITADA: 'Inabilitada',
  STATUS_ALTERADO: 'Status alterado',
  AVALIADOR_ATRIBUIDO: 'Avaliador atribuído',
  AVALIADOR_REMOVIDO: 'Avaliador removido',
  MEMBRO_EDITAL_ADICIONADO: 'Membro adicionado ao edital',
  MEMBRO_EDITAL_REMOVIDO: 'Membro removido do edital',
  NOTICIA_CRIADA: 'Notícia criada',
  NOTICIA_ATUALIZADA: 'Notícia atualizada',
  NOTICIA_EXCLUIDA: 'Notícia excluída',
  CMS_PAGINA_CRIADA: 'Página CMS criada',
  CMS_PAGINA_ATUALIZADA: 'Página CMS atualizada',
  CMS_PAGINA_EXCLUIDA: 'Página CMS excluída',
  FAQ_CRIADO: 'FAQ criado',
  FAQ_ATUALIZADO: 'FAQ atualizado',
  FAQ_EXCLUIDO: 'FAQ excluído',
  RESULTADO_CALCULADO: 'Resultado calculado',
  RESULTADO_PRELIMINAR_PUBLICADO: 'Resultado preliminar publicado',
  RESULTADO_FINAL_PUBLICADO: 'Resultado final publicado',
  RECURSO_SUBMETIDO: 'Recurso submetido',
  RECURSO_DECIDIDO: 'Recurso decidido',
  TIPO_ANEXO_CRIADO: 'Tipo de anexo criado',
  TIPO_ANEXO_ATUALIZADO: 'Tipo de anexo atualizado',
  TIPO_ANEXO_EXCLUIDO: 'Tipo de anexo excluído',
  CATEGORIA_CRIADA: 'Categoria criada',
  CATEGORIA_ATUALIZADA: 'Categoria atualizada',
  CATEGORIA_EXCLUIDA: 'Categoria excluída',
  CATEGORIAS_REORDENADAS: 'Categorias reordenadas',
  TEMPLATE_AVALIACAO_CRIADO: 'Template de avaliação criado',
  TEMPLATE_AVALIACAO_ATUALIZADO: 'Template de avaliação atualizado',
  TEMPLATE_AVALIACAO_EXCLUIDO: 'Template de avaliação excluído',
  EXPORTACAO_CSV: 'Exportação CSV',
  EXPORTACAO_LISTA_PDF: 'Exportação lista PDF',
  EXPORTACAO_RELATORIO_FINAL: 'Exportação relatório final',
  IMPORTACAO_CONTEMPLADOS: 'Importação contemplados',
}

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
// Variante de badge por categoria de ação
// ─────────────────────────────────────────────────────────────────────────────

/** Mapeia categorias de ação para variante de badge */
export function actionBadgeVariant(action: string): 'success' | 'error' | 'warning' | 'info' | 'neutral' {
  if (action === 'LOGIN') return 'success'
  if (action === 'LOGIN_FALHA') return 'error'
  if (action.includes('EXCLU') || action.includes('INABILITADA')) return 'error'
  if (action.includes('CRIA') || action.includes('CADASTRO') || action.includes('HABILITADA')) return 'success'
  if (action.includes('ATUALIZ') || action.includes('PUBLICAD')) return 'info'
  if (action.includes('RESET') || action.includes('RECURSO')) return 'warning'
  return 'neutral'
}

// ─────────────────────────────────────────────────────────────────────────────
// Retenção — limpeza de logs antigos
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Dias de retenção — configurável via env AUDIT_RETENTION_DAYS (padrão: 365).
 */
export function getRetentionDays(): number {
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
