'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'
import { COOKIE_ESPELHO, DURACAO_ESPELHO_SEGUNDOS } from '../sessao-avaliador'

const CAMINHO_COOKIE = '/avaliador'

/** Só o SUPER_ADMIN usa o espelho; qualquer outro perfil é devolvido sem efeito colateral. */
async function exigirSuperAdmin() {
  const session = await auth()
  if (!session || session.user.role !== 'SUPER_ADMIN') redirect('/')
  return session
}

/** Passa a mostrar a área do avaliador escolhido, registrando na auditoria quem acompanhou quem. */
export async function entrarModoEspelho(formData: FormData) {
  const session = await exigirSuperAdmin()

  const alvo = await prisma.user.findFirst({
    where: { id: String(formData.get('avaliadorId') ?? ''), role: 'AVALIADOR', ativo: true },
    select: { id: true, nome: true },
  })
  if (!alvo) redirect('/avaliador/espelho')

  ;(await cookies()).set(COOKIE_ESPELHO, alvo.id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: CAMINHO_COOKIE,
    maxAge: DURACAO_ESPELHO_SEGUNDOS,
  })

  await logAudit({
    userId: session.user.id,
    action: AUDIT_ACTIONS.ESPELHO_AVALIADOR_INICIADO,
    entity: 'User',
    entityId: alvo.id,
    details: { avaliador: alvo.nome },
  })

  redirect('/avaliador/recursos')
}

export async function sairModoEspelho() {
  await exigirSuperAdmin()
  ;(await cookies()).delete({ name: COOKIE_ESPELHO, path: CAMINHO_COOKIE })
  redirect('/admin')
}
