import type { UserRole } from '@prisma/client'

type NotaFinalLike = {
  notaFinal: unknown
  notaBonus: unknown
}

/**
 * Bônus de cota só é visível pro SUPER_ADMIN, ou pro ADMIN quando liberado
 * especificamente pra aquele edital (`Edital.bonusVisivelParaAdmin`).
 * AVALIADOR nunca vê — mesma regra do painel dedicado de bônus
 * (`/admin/editais/[id]/bonus`), aplicada aqui em todo lugar que mostra nota.
 */
export function podeVerBonus(role: UserRole, bonusVisivelParaAdmin: boolean): boolean {
  if (role === 'SUPER_ADMIN') return true
  if (role === 'ADMIN') return bonusVisivelParaAdmin
  return false
}

/**
 * Nota exibível pro viewer — subtrai o bônus de cota já embutido em
 * `notaFinal` quando o viewer não tem permissão de vê-lo.
 */
export function viewNotaFinal(
  inscricao: NotaFinalLike,
  role: UserRole,
  bonusVisivelParaAdmin: boolean,
): number | null {
  if (inscricao.notaFinal === null || inscricao.notaFinal === undefined) return null
  const notaFinal = Number(inscricao.notaFinal)
  if (!Number.isFinite(notaFinal)) return null

  if (podeVerBonus(role, bonusVisivelParaAdmin)) return notaFinal

  const bonus = inscricao.notaBonus === null || inscricao.notaBonus === undefined
    ? 0
    : Number(inscricao.notaBonus)
  return notaFinal - (Number.isFinite(bonus) ? bonus : 0)
}
