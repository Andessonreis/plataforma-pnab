import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

const bodySchema = z.object({
  nome: z.string().min(2, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
})

export async function POST(req: NextRequest) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const body = await req.json()
    const { nome, email } = bodySchema.parse(body)

    // Verificar se já está inscrito
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    })

    if (existing) {
      // Se estava inativo, reativar
      if (!existing.ativo) {
        await prisma.newsletterSubscriber.update({
          where: { email },
          data: { ativo: true, nome },
        })
      }
      // Não revelar se já existia — retornar sucesso genérico
    } else {
      await prisma.newsletterSubscriber.create({
        data: { nome, email },
      })
    }

    const res = NextResponse.json(
      { message: 'Inscrição realizada com sucesso!', requestId },
      { status: 201 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    console.log({ requestId, method: 'POST', path: '/api/newsletter', status: 201, durationMs: Date.now() - start })
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

    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    const res = NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro ao processar inscrição', requestId },
      { status: 500 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  }
}
