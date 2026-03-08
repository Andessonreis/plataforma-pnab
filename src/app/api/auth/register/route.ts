import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'
import { rateLimit } from '@/lib/rate-limit'
import { RATE_LIMITS } from '@/lib/rate-limit/config'

export const runtime = 'nodejs'

const registerSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cpfCnpj: z.string().min(11).max(14),
  email: z.string().email('E-mail inválido'),
  telefone: z.string().optional(),
  cep: z.string().min(8, 'CEP inválido').max(8),
  logradouro: z.string().min(1, 'Logradouro obrigatório'),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().min(1, 'Bairro obrigatório'),
  cidade: z.string().min(1, 'Cidade obrigatória'),
  uf: z.string().length(2, 'UF inválida'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  tipoProponente: z.enum(['PF', 'PJ', 'MEI', 'COLETIVO']),
})

export async function POST(req: NextRequest) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    // Rate limiting: 5 req/min
    const limited = await rateLimit(req, 'auth/register', RATE_LIMITS['auth/register'])
    if (limited) return limited

    const body = await req.json()
    const data = registerSchema.parse(body)

    // Verifica se já existe usuário com esse CPF/CNPJ ou e-mail
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { cpfCnpj: data.cpfCnpj },
          { email: data.email },
        ],
      },
    })

    if (existing) {
      const campo = existing.cpfCnpj === data.cpfCnpj ? 'CPF/CNPJ' : 'E-mail'
      const res = NextResponse.json(
        { error: 'CONFLICT', message: `${campo} já cadastrado.`, requestId },
        { status: 409 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const hashedPassword = await bcrypt.hash(data.password, 12)

    const user = await prisma.user.create({
      data: {
        nome: data.nome,
        cpfCnpj: data.cpfCnpj,
        email: data.email,
        telefone: data.telefone ?? null,
        cep: data.cep,
        logradouro: data.logradouro,
        numero: data.numero ?? null,
        complemento: data.complemento ?? null,
        bairro: data.bairro,
        cidade: data.cidade,
        uf: data.uf,
        password: hashedPassword,
        tipoProponente: data.tipoProponente,
        role: 'PROPONENTE',
      },
    })

    await logAudit({
      userId: user.id,
      action: AUDIT_ACTIONS.CADASTRO,
      entity: 'User',
      entityId: user.id,
      details: { tipoProponente: data.tipoProponente },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const res = NextResponse.json(
      { message: 'Conta criada com sucesso.', userId: user.id, requestId },
      { status: 201 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'POST',
      path: '/api/auth/register',
      status: 201,
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
