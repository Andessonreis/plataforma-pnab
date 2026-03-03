import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token obrigatório'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
})

export async function POST(req: NextRequest) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const body = await req.json()
    const data = resetPasswordSchema.parse(body)

    // Busca o token válido (não usado e não expirado)
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: data.token },
      include: { user: true },
    })

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      const res = NextResponse.json(
        {
          error: 'INVALID_TOKEN',
          message: 'Link inválido ou expirado. Solicite uma nova recuperação de senha.',
          requestId,
        },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(data.password, 12)

    // Atualiza a senha do usuário e marca o token como usado (transação)
    await prisma.$transaction([
      // Atualiza a senha
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      // Marca o token atual como usado
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      // Invalida todos os outros tokens do usuário
      prisma.passwordResetToken.updateMany({
        where: {
          userId: resetToken.userId,
          id: { not: resetToken.id },
          usedAt: null,
        },
        data: { usedAt: new Date() },
      }),
    ])

    const res = NextResponse.json(
      { message: 'Senha redefinida com sucesso.', requestId },
      { status: 200 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'POST',
      path: '/api/auth/reset-password',
      status: 200,
      durationMs: Date.now() - start,
    })

    return res
  } catch (err) {
    if (err instanceof z.ZodError) {
      const res = NextResponse.json(
        { error: 'VALIDATION_ERROR', message: err.errors[0].message, requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    console.error({
      requestId,
      error: err instanceof Error ? err.message : 'Unknown',
    })

    const res = NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro interno. Tente novamente.', requestId },
      { status: 500 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  }
}
