import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { RATE_LIMITS } from '@/lib/rate-limit/config'
import { generateUniqueProtocolo } from '@/lib/atendimento/protocolo'

export const runtime = 'nodejs'

const contatoSchema = z.object({
  nomeContato: z.string().min(2, 'Nome deve ter no minimo 2 caracteres'),
  emailContato: z.string().email('E-mail invalido'),
  editalId: z.string().cuid().optional(),
  assunto: z.string().min(3, 'Assunto deve ter no minimo 3 caracteres').max(200, 'Assunto muito longo'),
  mensagem: z.string().min(10, 'Mensagem deve ter no minimo 10 caracteres').max(5000, 'Mensagem muito longa'),
})

export async function POST(req: NextRequest) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    // Rate limiting: 5 req/min
    const limited = await rateLimit(req, 'contato', RATE_LIMITS['contato'])
    if (limited) return limited

    const body = await req.json()
    const data = contatoSchema.parse(body)

    const protocolo = await generateUniqueProtocolo()

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

    // Cria o atendimento
    await prisma.atendimento.create({
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
