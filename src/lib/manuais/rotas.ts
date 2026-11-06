import type { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { forbidden, type ApiContext } from '@/lib/api/response'
import { getIp, requireRole, resolveAuth } from '@/lib/api/auth-resolver'
import { manipulador } from '@/lib/memorial/rotas'
import type { Autor } from '@/lib/services/memorial-conteudo.service'
import { ROLES_MANUAIS } from './regras'

/** Rotas de /api/v1/manuais: só quem gerencia os manuais (SUPER_ADMIN sempre passa). */
export function rotaManuais(
  metodo: string,
  caminho: string,
  executar: (req: NextRequest, ctx: ApiContext, autor: Autor, params: Record<string, string>) => Promise<NextResponse>,
) {
  return manipulador(metodo, caminho, async (req, ctx, params) => {
    const caller = await resolveAuth(req)
    if (!requireRole(caller, ...ROLES_MANUAIS)) return forbidden(ctx)
    return executar(req, ctx, { userId: caller.userId, role: caller.role, ip: getIp(req) }, params)
  })
}

/** A página pública é estática; sem isso a alteração só aparece no próximo build. */
export function revalidarPaginaPublica() {
  revalidatePath('/manuais')
}
