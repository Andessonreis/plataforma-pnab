import { cookies } from 'next/headers'
import type { Session } from 'next-auth'
import { prisma } from '@/lib/db'
import { ESPELHO, type PapelEspelho } from './papeis'

export interface UsuarioEspelhado {
  usuarioId: string
  nome: string
}

/**
 * Usuário que o SUPER_ADMIN está acompanhando no modo espelho, ou null.
 *
 * Só o SUPER_ADMIN usa o cookie. Qualquer outro perfil o ignora, senão um
 * avaliador ou habilitador poderia assumir a visão de um colega. O alvo precisa
 * ser um usuário ativo do papel pedido.
 */
export async function lerEspelho(
  session: Session | null,
  papel: PapelEspelho,
): Promise<UsuarioEspelhado | null> {
  if (session?.user.role !== 'SUPER_ADMIN') return null

  const alvoId = (await cookies()).get(ESPELHO[papel].cookie)?.value
  if (!alvoId) return null

  const alvo = await prisma.user.findFirst({
    where: { id: alvoId, role: papel, ativo: true },
    select: { id: true, nome: true },
  })
  return alvo ? { usuarioId: alvo.id, nome: alvo.nome } : null
}
