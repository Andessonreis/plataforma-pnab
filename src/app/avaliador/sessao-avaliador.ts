import { redirect } from 'next/navigation'
import type { Session } from 'next-auth'
import { auth } from '@/lib/auth'
import { lerEspelho } from '@/lib/espelho/visao'

export interface SessaoAvaliador {
  /** Avaliador cuja visão as telas devem montar: o próprio, ou o espelhado. */
  avaliadorId: string
  nome: string
  /** Verdadeiro quando um SUPER_ADMIN vê a área como outro avaliador, sem poder gravar. */
  espelho: boolean
}

/**
 * Descobre de quem é a visão da área do avaliador. AVALIADOR sempre enxerga a si
 * mesmo; só o SUPER_ADMIN passa pelo modo espelho (`lerEspelho`).
 */
export async function resolverSessaoAvaliador(session: Session | null): Promise<SessaoAvaliador | null> {
  if (!session) return null

  const { role, id, name } = session.user
  if (role === 'AVALIADOR') return { avaliadorId: id, nome: name ?? 'Avaliador', espelho: false }

  const alvo = await lerEspelho(session, 'AVALIADOR')
  return alvo ? { avaliadorId: alvo.usuarioId, nome: alvo.nome, espelho: true } : null
}

export async function obterSessaoAvaliador(): Promise<SessaoAvaliador | null> {
  return resolverSessaoAvaliador(await auth())
}

/**
 * Para as páginas da área do avaliador. Sem sessão utilizável, o SUPER_ADMIN vai
 * escolher quem espelhar e os demais perfis voltam ao login.
 */
export async function exigirSessaoAvaliador(): Promise<SessaoAvaliador> {
  const session = await auth()
  const sessao = await resolverSessaoAvaliador(session)
  if (sessao) return sessao

  redirect(session?.user.role === 'SUPER_ADMIN' ? '/avaliador/espelho' : '/login')
}
