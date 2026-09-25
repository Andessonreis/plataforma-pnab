import type { Session } from 'next-auth'
import { lerEspelho } from '@/lib/espelho/visao'

export interface VisaoHabilitacao {
  /** Habilitador cuja equipe delimita os editais. Nulo na visão completa (ADMIN e SUPER_ADMIN). */
  escopoId: string | null
  /** Nome do habilitador acompanhado pelo SUPER_ADMIN. Nulo fora do modo espelho. */
  espelho: string | null
}

/**
 * Define de quem é a visão das telas de habilitação. O habilitador vê o que a
 * própria equipe cobre; ADMIN e SUPER_ADMIN veem tudo, exceto quando o
 * SUPER_ADMIN escolheu acompanhar um habilitador (`lerEspelho`).
 */
export async function resolverVisaoHabilitacao(session: Session): Promise<VisaoHabilitacao> {
  if (session.user.role === 'HABILITADOR') return { escopoId: session.user.id, espelho: null }

  const alvo = await lerEspelho(session, 'HABILITADOR')
  return alvo ? { escopoId: alvo.usuarioId, espelho: alvo.nome } : { escopoId: null, espelho: null }
}
