import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { enqueueEmail } from '@/lib/queue'
import { ServiceError } from './errors'
import type { HabilitacaoInput } from '@/lib/schemas/habilitacao'

export async function updateHabilitacao(
  inscricaoId: string,
  data: HabilitacaoInput,
  userId: string,
  ip?: string,
) {
  const inscricao = await prisma.inscricao.findUnique({
    where: { id: inscricaoId },
    select: {
      id: true,
      numero: true,
      status: true,
      proponente: { select: { email: true, nome: true } },
      edital: { select: { titulo: true } },
    },
  })

  if (!inscricao) throw new ServiceError('NOT_FOUND', 'Inscrição não encontrada.')

  const updateData: Record<string, unknown> = { status: data.status }
  if (data.status === 'INABILITADA') {
    updateData.motivoInabilitacao = data.motivo
  } else {
    updateData.motivoInabilitacao = null
  }

  await prisma.inscricao.update({ where: { id: inscricaoId }, data: updateData })

  await logAudit({
    userId,
    action: data.status === 'HABILITADA' ? 'INSCRICAO_HABILITADA' : 'INSCRICAO_INABILITADA',
    entity: 'Inscricao',
    entityId: inscricaoId,
    details: {
      numero: inscricao.numero,
      statusAnterior: inscricao.status,
      novoStatus: data.status,
      motivo: data.motivo ?? null,
    },
    ip,
  })

  try {
    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
    await enqueueEmail({
      to: inscricao.proponente.email,
      subject: `Resultado da Habilitação — ${inscricao.edital.titulo}`,
      template: 'habilitacao',
      data: {
        nome: inscricao.proponente.nome,
        numero: inscricao.numero,
        edital: inscricao.edital.titulo,
        resultado: data.status,
        motivo: data.motivo ?? null,
        url: `${baseUrl}/proponente/inscricoes`,
      },
    })
  } catch {
    console.error('[habilitacao] Falha ao enfileirar e-mail de habilitação')
  }
}
