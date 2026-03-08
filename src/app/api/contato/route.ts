import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { RATE_LIMITS } from '@/lib/rate-limit/config'

export const runtime = 'nodejs'

const contatoSchema = z.object({
  nomeContato: z.string().min(2, 'Nome deve ter no minimo 2 caracteres'),
  emailContato: z.string().email('E-mail invalido'),
  editalId: z.string().cuid().optional(),
  assunto: z.string().min(3, 'Assunto deve ter no minimo 3 caracteres').max(200, 'Assunto muito longo'),
  mensagem: z.string().min(10, 'Mensagem deve ter no minimo 10 caracteres').max(5000, 'Mensagem muito longa'),
})

function generateProtocolo(): string {
  const year = new Date().getFullYear()
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `PNAB-${year}-${code}`
}

export async function POST(req: NextRequest) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    // Rate limiting: 5 req/min
    const limited = await rateLimit(req, 'contato', RATE_LIMITS['contato'])
    if (limited) return limited

    const body = await req.json()
    const data = contatoSchema.parse(body)

    // Gera protocolo unico
    let protocolo = generateProtocolo()

    // Verifica unicidade (improvavel, mas seguro)
    let exists = await prisma.ticket.findUnique({ where: { protocolo } })
    let attempts = 0
    while (exists && attempts < 5) {
      protocolo = generateProtocolo()
      exists = await prisma.ticket.findUnique({ where: { protocolo } })
      attempts++
    }

    // Se o editalId foi informado, verifica se o edital existe
    if (data.editalId) {
      const editalExists = await prisma.edital.findUnique({
        where: { id: data.editalId },
        select: { id: true },
      })
      if (!editalExists) {
        const res = NextResponse.json(
          { error: 'NOT_FOUND', message: 'Edital nao encontrado.', requestId },
          { status: 404 },
        )
        res.headers.set('X-Request-Id', requestId)
        res.headers.set('Cache-Control', 'no-store')
        return res
      }
    }

    // Cria o ticket
    await prisma.ticket.create({
      data: {
        protocolo,
        nomeContato: data.nomeContato,
        emailContato: data.emailContato,
        assunto: data.assunto,
        mensagem: data.mensagem,
        editalId: data.editalId ?? null,
        status: 'ABERTO',
        historico: [],
      },
    })

    const res = NextResponse.json(
      { protocolo, message: 'Mensagem enviada com sucesso.', requestId },
      { status: 201 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'POST',
      path: '/api/contato',
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
