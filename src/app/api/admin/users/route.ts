import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import bcrypt from 'bcryptjs'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { passwordSchema } from '@/lib/schemas/user'
import { isValidCpf, isValidCnpj } from '@/lib/validators/document'

export const runtime = 'nodejs'

// ── Schema de validação ─────────────────────────────────────────────────────

const createUserSchema = z.object({
  nome: z.string().trim().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().trim().email('E-mail inválido'),
  cpfCnpj: z.string()
    .transform((v) => v.replace(/\D/g, ''))
    .refine(
      (v) => (v.length === 11 && isValidCpf(v)) || (v.length === 14 && isValidCnpj(v)),
      'CPF/CNPJ inválido',
    ),
  telefone: z.string().trim().optional(),
  role: z.enum(['PROPONENTE', 'ATENDIMENTO', 'HABILITADOR', 'AVALIADOR', 'ADMIN']),
  password: passwordSchema,
  tipoProponente: z.enum(['PF', 'PJ', 'MEI', 'COLETIVO']).optional(),
}).superRefine((data, ctx) => {
  if (data.role === 'PROPONENTE' && !data.tipoProponente) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['tipoProponente'],
      message: 'Tipo de proponente é obrigatório para o perfil Proponente',
    })
  }
})

// ── POST — Criar usuário (admin) ────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso negado.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const body = await req.json()
    const data = createUserSchema.parse(body)

    const existing = await prisma.user.findFirst({
      where: { OR: [{ cpfCnpj: data.cpfCnpj }, { email: data.email }] },
    })

    if (existing) {
      const campo = existing.cpfCnpj === data.cpfCnpj ? 'cpfCnpj' : 'email'
      const label = campo === 'cpfCnpj' ? 'CPF/CNPJ' : 'E-mail'
      const res = NextResponse.json(
        {
          error: 'CONFLICT',
          message: `${label} já cadastrado.`,
          fieldErrors: { [campo]: `${label} já cadastrado.` },
          requestId,
        },
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
        email: data.email,
        cpfCnpj: data.cpfCnpj,
        telefone: data.telefone || null,
        password: hashedPassword,
        role: data.role,
        tipoProponente: data.role === 'PROPONENTE' ? data.tipoProponente : null,
      },
    })

    await logAudit({
      userId: session.user.id,
      action: 'USUARIO_CRIADO',
      entity: 'User',
      entityId: user.id,
      details: { role: data.role },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const res = NextResponse.json(
      { message: 'Usuário criado com sucesso.', id: user.id, requestId },
      { status: 201 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'POST',
      path: '/api/admin/users',
      status: 201,
      durationMs: Date.now() - start,
    })

    return res
  } catch (err) {
    if (err instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {}
      for (const e of err.errors) {
        fieldErrors[e.path.join('.')] = e.message
      }
      const res = NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Dados inválidos.', fieldErrors, requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })

    const res = NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro interno.', requestId },
      { status: 500 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  }
}
