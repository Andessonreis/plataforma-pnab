import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'
import { enqueueEmail } from '@/lib/queue'

export const runtime = 'nodejs'

interface CampoFormulario {
  nome: string
  tipo: string
  obrigatorio?: boolean
  label?: string
}

interface RouteParams {
  params: Promise<{ id: string }>
}

// ─── POST — Submeter inscrição (RASCUNHO → ENVIADA) ────────────────────────

export async function POST(req: NextRequest, { params }: RouteParams) {
  const requestId = randomUUID()
  const start = Date.now()
  const { id } = await params

  try {
    const session = await auth()
    if (!session || session.user.role !== 'PROPONENTE') {
      const res = NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Acesso negado.', requestId },
        { status: 401 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const inscricao = await prisma.inscricao.findUnique({
      where: { id },
      include: {
        edital: {
          select: {
            id: true,
            titulo: true,
            status: true,
            categorias: true,
            camposFormulario: true,
          },
        },
        anexos: true,
        proponente: {
          select: { email: true, nome: true },
        },
      },
    })

    if (!inscricao) {
      const res = NextResponse.json(
        { error: 'NOT_FOUND', message: 'Inscrição não encontrada.', requestId },
        { status: 404 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    if (inscricao.proponenteId !== session.user.id) {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso negado.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    if (inscricao.status !== 'RASCUNHO') {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'Esta inscrição já foi enviada.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    if (inscricao.edital.status !== 'INSCRICOES_ABERTAS') {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'O prazo de inscrições para este edital foi encerrado.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // Validação: categoria obrigatória se edital tem categorias
    if (inscricao.edital.categorias.length > 0 && !inscricao.categoria) {
      const res = NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Selecione uma categoria antes de enviar.', requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // Validação: campos obrigatórios preenchidos
    const camposFormulario = (inscricao.edital.camposFormulario as unknown as CampoFormulario[]) || []
    const campos = (inscricao.campos as Record<string, unknown>) || {}
    const camposFaltando: string[] = []

    for (const campo of camposFormulario) {
      if (campo.obrigatorio && campo.tipo !== 'arquivo') {
        const valor = campos[campo.nome]
        if (valor === undefined || valor === null || valor === '') {
          camposFaltando.push(campo.label || campo.nome)
        }
      }
    }

    if (camposFaltando.length > 0) {
      const res = NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: `Campos obrigatórios não preenchidos: ${camposFaltando.join(', ')}`,
          camposFaltando,
          requestId,
        },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // Validação: pelo menos 1 anexo
    if (inscricao.anexos.length === 0) {
      const res = NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Envie pelo menos um anexo antes de submeter.', requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // Atualizar status
    const now = new Date()
    const updated = await prisma.inscricao.update({
      where: { id },
      data: {
        status: 'ENVIADA',
        submittedAt: now,
      },
      select: { numero: true, submittedAt: true },
    })

    await logAudit({
      userId: session.user.id,
      action: AUDIT_ACTIONS.INSCRICAO_ENVIADA,
      entity: 'Inscricao',
      entityId: id,
      details: { numero: updated.numero, editalId: inscricao.editalId },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    // Enfileirar e-mail de confirmação
    try {
      await enqueueEmail({
        to: inscricao.proponente.email,
        subject: `Inscrição ${updated.numero} enviada com sucesso`,
        template: 'comprovante_inscricao',
        data: {
          nome: inscricao.proponente.nome,
          numero: updated.numero,
          edital: inscricao.edital.titulo,
          submittedAt: now.toISOString(),
        },
      })
    } catch {
      // Falha no enfileiramento não deve bloquear a submissão
      console.error({ requestId, message: 'Falha ao enfileirar e-mail de confirmação' })
    }

    const res = NextResponse.json(
      { numero: updated.numero, submittedAt: updated.submittedAt, requestId },
      { status: 200 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({ requestId, method: 'POST', path: `/api/proponente/inscricoes/${id}/submit`, status: 200, durationMs: Date.now() - start })
    return res
  } catch (err) {
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
