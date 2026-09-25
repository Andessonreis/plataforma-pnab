import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Session } from 'next-auth'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

/** Cookie que guarda qual avaliador o SUPER_ADMIN está acompanhando no modo espelho. */
export const COOKIE_ESPELHO = 'pnab.espelho-avaliador'

/** Duração do modo espelho; depois disso o SUPER_ADMIN escolhe o avaliador de novo. */
export const DURACAO_ESPELHO_SEGUNDOS = 60 * 60 * 4

export interface SessaoAvaliador {
  /** Avaliador cuja visão as telas devem montar: o próprio, ou o espelhado. */
  avaliadorId: string
  nome: string
  /** Verdadeiro quando um SUPER_ADMIN vê a área como outro avaliador, sem poder gravar. */
  espelho: boolean
}

/**
 * Descobre de quem é a visão da área do avaliador.
 *
 * AVALIADOR sempre enxerga a si mesmo, e o cookie do espelho é ignorado para
 * ele: se valesse, qualquer avaliador poderia assumir a visão de outro. Só o
 * SUPER_ADMIN usa o cookie, e o alvo precisa ser um AVALIADOR ativo.
 */
export async function resolverSessaoAvaliador(session: Session | null): Promise<SessaoAvaliador | null> {
  if (!session) return null

  const { role, id, name } = session.user
  if (role === 'AVALIADOR') return { avaliadorId: id, nome: name ?? 'Avaliador', espelho: false }
  if (role !== 'SUPER_ADMIN') return null

  const alvoId = (await cookies()).get(COOKIE_ESPELHO)?.value
  if (!alvoId) return null

  const alvo = await prisma.user.findFirst({
    where: { id: alvoId, role: 'AVALIADOR', ativo: true },
    select: { id: true, nome: true },
  })
  return alvo ? { avaliadorId: alvo.id, nome: alvo.nome, espelho: true } : null
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
