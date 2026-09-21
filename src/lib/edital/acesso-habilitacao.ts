import type { UserRole } from '@prisma/client'
import { logAudit } from '@/lib/audit'
import { temAcessoEdital } from '@/lib/edital-acesso'

/** Papéis que operam a conferência de habilitação. */
export const ROLES_HABILITACAO: UserRole[] = ['HABILITADOR', 'SUPER_ADMIN', 'ADMIN']

export const MENSAGEM_FORA_DA_EQUIPE = 'Você não está atribuído à equipe de habilitação deste edital.'

interface EscopoHabilitacao {
  userId: string
  role: UserRole
  editalId: string
  /** Registro sobre o qual a ação foi tentada, para a auditoria da negativa. */
  alvo: { entity: 'Inscricao' | 'Edital'; id: string }
  ip?: string
}

/**
 * HABILITADOR só age em editais em que está na equipe. A tentativa fora do
 * escopo é negada e auditada; os demais papéis não passam por esse escopo.
 */
export async function acessoHabilitacaoPermitido({
  userId,
  role,
  editalId,
  alvo,
  ip,
}: EscopoHabilitacao): Promise<boolean> {
  if (role !== 'HABILITADOR') return true
  if (await temAcessoEdital(userId, editalId, 'HABILITADOR')) return true

  await logAudit({
    userId,
    action: 'HABILITACAO_ACESSO_NEGADO',
    entity: alvo.entity,
    entityId: alvo.id,
    details: { editalId, motivo: 'Usuário não pertence à equipe de habilitação deste edital.' },
    ip,
  })
  return false
}
