import { NextRequest } from 'next/server'
import { prisma } from '@server/lib/db'
import { createContext, ok, handleError, unauthorized, logRequest } from '@/lib/api/response'
import { resolveAuth, requireAnyAuth, getIp } from '@/lib/api/auth-resolver'
import { updateProfileSchema } from '@/lib/schemas/user'
import * as userService from '@/lib/services/user.service'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireAnyAuth(caller)) return unauthorized(ctx)
    const user = await prisma.user.findUnique({
      where: { id: caller.userId },
      select: {
        id: true, nome: true, email: true, cpfCnpj: true, role: true,
        tipoProponente: true, telefone: true, cep: true, logradouro: true,
        numero: true, complemento: true, bairro: true, cidade: true, uf: true,
        createdAt: true,
      },
    })
    logRequest(ctx, 'GET', '/api/v1/me', 200)
    return ok(ctx, user)
  } catch (err) {
    return handleError(ctx, err)
  }
}

export async function PUT(req: NextRequest) {
  const ctx = createContext()
  try {
    const caller = await resolveAuth(req)
    if (!requireAnyAuth(caller)) return unauthorized(ctx)
    const data = updateProfileSchema.parse(await req.json())
    await userService.updateProfile(caller.userId, data, getIp(req))
    logRequest(ctx, 'PUT', '/api/v1/me', 200)
    return ok(ctx, { message: 'Perfil atualizado.' })
  } catch (err) {
    return handleError(ctx, err)
  }
}
