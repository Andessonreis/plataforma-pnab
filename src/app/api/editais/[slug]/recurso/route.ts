import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { RATE_LIMITS } from '@/lib/rate-limit/config'
import { generateUniqueProtocolo } from '@/lib/atendimento/protocolo'
import { janelaParaAcao, mensagemJanela } from '@/lib/utils/cronograma-janela'

export const runtime = 'nodejs'

const recursoEditalSchema = z.object({
  nomeCompleto: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(200),
  email: z.string().email('E-mail inválido'),
  telefone: z.string().min(8, 'Telefone inválido').max(20),
  motivo: z.string().min(20, 'Motivo deve ter no mínimo 20 caracteres').max(3000, 'Motivo muito longo'),
})

interface RouteParams {
  params: Promise<{ slug: string }>
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const requestId = randomUUID()
  const start = Date.now()
  const { slug } = await params

  try {
    const limited = await rateLimit(req, 'recurso-edital', RATE_LIMITS['recurso-edital'])
    if (limited) return limited

    const body = await req.json()
    const data = recursoEditalSchema.parse(body)

    const edital = await prisma.edital.findUnique({
      where: { slug },
      select: { id: true, titulo: true, cronograma: true },
    })

    if (!edital) {
      const res = NextResponse.json(
        { error: 'NOT_FOUND', message: 'Edital não encontrado.', requestId },
        { status: 404 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const janela = janelaParaAcao(edital.cronograma, 'RECURSO_EDITAL_JANELA')
    if (!janela?.ativa) {
      const message = janela
        ? `Fora do período de recurso contra o edital. ${mensagemJanela(janela)}.`
        : 'Este edital não tem período de recurso configurado.'
      const res = NextResponse.json(
        { error: 'FORA_DA_JANELA', message, requestId },
        { status: 422 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const protocolo = await generateUniqueProtocolo()

    await prisma.atendimento.create({
      data: {
        protocolo,
        nomeContato: data.nomeCompleto,
        emailContato: data.email,
        telefone: data.telefone,
        assunto: `Publicação do Edital — ${edital.titulo}`,
        mensagem: data.motivo,
        editalId: edital.id,
        status: 'ABERTO',
        historico: [],
      },
    })

    const res = NextResponse.json(
      { protocolo, message: 'Recurso interposto com sucesso.', requestId },
      { status: 201 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({
      requestId,
      method: 'POST',
      path: `/api/editais/${slug}/recurso`,
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

    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })

    const res = NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro interno. Tente novamente.', requestId },
      { status: 500 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  }
}
