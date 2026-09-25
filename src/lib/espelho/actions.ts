'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'
import { DURACAO_ESPELHO_SEGUNDOS, ESPELHO, papelEspelho } from './papeis'

/** Só o SUPER_ADMIN usa o espelho; qualquer outro perfil é devolvido sem efeito colateral. */
async function exigirSuperAdmin() {
  const session = await auth()
  if (!session || session.user.role !== 'SUPER_ADMIN') redirect('/')
  return session
}

/** Passa a mostrar a área do usuário escolhido, registrando na auditoria quem acompanhou quem. */
export async function entrarModoEspelho(formData: FormData) {
  const session = await exigirSuperAdmin()

  const papel = papelEspelho(formData.get('papel'))
  if (!papel) redirect('/')
  const config = ESPELHO[papel]

  const alvo = await prisma.user.findFirst({
    where: { id: String(formData.get('usuarioId') ?? ''), role: papel, ativo: true },
    select: { id: true, nome: true },
  })
  if (!alvo) redirect(config.escolha)

  ;(await cookies()).set(config.cookie, alvo.id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: config.caminho,
    maxAge: DURACAO_ESPELHO_SEGUNDOS,
  })

  await logAudit({
    userId: session.user.id,
    action: AUDIT_ACTIONS.ESPELHO_INICIADO,
    entity: 'User',
    entityId: alvo.id,
    details: { papel, usuario: alvo.nome },
  })

  redirect(config.destino)
}

export async function sairModoEspelho(formData: FormData) {
  await exigirSuperAdmin()

  const papel = papelEspelho(formData.get('papel'))
  if (!papel) redirect('/')
  const config = ESPELHO[papel]

  ;(await cookies()).delete({ name: config.cookie, path: config.caminho })
  redirect(config.saida)
}
