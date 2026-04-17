import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID, randomBytes, createHash } from 'crypto'
import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/mail'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'
import { rateLimit } from '@/lib/rate-limit'
import { RATE_LIMITS } from '@/lib/rate-limit/config'

export const runtime = 'nodejs'

const forgotPasswordSchema = z.object({
  cpfCnpj: z.string().min(1, 'CPF/CNPJ obrigatório').optional(),
  email: z.string().email('E-mail inválido').optional(),
}).refine(
  (data) => data.cpfCnpj || data.email,
  { message: 'Informe o CPF/CNPJ ou e-mail.' },
)

export async function POST(req: NextRequest) {
  const requestId = randomUUID()
  const start = Date.now()

  // Mensagem genérica — nunca revela se o usuário existe
  const successMessage =
    'Se os dados estiverem cadastrados, você receberá um e-mail com instruções para redefinir sua senha.'

  try {
    // Rate limiting: 3 req/min
    const limited = await rateLimit(req, 'auth/forgot-password', RATE_LIMITS['auth/forgot-password'])
    if (limited) return limited

    const body = await req.json()
    const data = forgotPasswordSchema.parse(body)

    // Busca o usuário por CPF/CNPJ (limpo) ou e-mail
    const cpfCnpjLimpo = data.cpfCnpj?.replace(/\D/g, '')

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(cpfCnpjLimpo ? [{ cpfCnpj: cpfCnpjLimpo }] : []),
          ...(data.email ? [{ email: data.email }] : []),
        ],
        ativo: true,
      },
    })

    if (user) {
      // Invalida tokens anteriores não usados
      await prisma.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          usedAt: null,
        },
        data: {
          usedAt: new Date(),
        },
      })

      // Gera novo token — envia raw ao usuário, salva apenas o hash no banco
      const rawToken = randomBytes(32).toString('hex')
      const tokenHash = createHash('sha256').update(rawToken).digest('hex')
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: tokenHash,
          expiresAt,
        },
      })

      // Envia e-mail com link de recuperação (token raw — nunca o hash)
      const resetUrl = `${process.env.NEXTAUTH_URL}/recuperar-senha/reset?token=${rawToken}`

      await sendEmail({
        to: user.email,
        subject: 'Recuperação de Senha — Cultura e Turismo Irecê',
        template: 'recuperacao_senha',
        data: {
          nome: user.nome,
          resetUrl,
          token: rawToken,
        },
      })

      await logAudit({
        userId: user.id,
        action: AUDIT_ACTIONS.SENHA_RESET_SOLICITADO,
        entity: 'User',
        entityId: user.id,
        ip: req.headers.get('x-forwarded-for') ?? undefined,
      })
    }

    // Sempre retorna sucesso (não vaza se o usuário existe)
    const res = NextResponse.json(
      { message: successMessage, requestId },
      { status: 200 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'POST',
      path: '/api/auth/forgot-password',
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

    // Mesmo com erro interno, retorna sucesso genérico para não vazar informação
    const res = NextResponse.json(
      { message: successMessage, requestId },
      { status: 200 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  }
}
