/**
 * Notifica a equipe interna (ADMIN e ATENDIMENTO ativos) quando um novo
 * atendimento é aberto — pelo formulário público de contato ou criado
 * diretamente via API. Chamado dos dois pontos de criação de atendimento
 * (`/api/contato` e `ticket.service.createAtendimento`).
 */

import { prisma } from '@/lib/db'
import { enqueueEmail } from '@/lib/queue'

const SITE_URL_FALLBACK = 'https://culturaeturismo.irece.ba.gov.br'

interface NotifyNovoAtendimentoParams {
  atendimentoId: string
  protocolo: string
  nomeContato: string
  assunto: string
  mensagem: string
}

export async function notifyEquipeNovoAtendimento({
  atendimentoId,
  protocolo,
  nomeContato,
  assunto,
  mensagem,
}: NotifyNovoAtendimentoParams): Promise<{ destinatarios: number }> {
  const destinatarios = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'SUPER_ADMIN', 'ATENDIMENTO'] }, ativo: true },
    select: { nome: true, email: true },
  })

  if (destinatarios.length === 0) {
    return { destinatarios: 0 }
  }

  const base = (process.env.NEXT_PUBLIC_SITE_URL || SITE_URL_FALLBACK).replace(/\/$/, '')
  const url = `${base}/admin/atendimentos/${atendimentoId}`

  await Promise.all(
    destinatarios.map((pessoa) =>
      enqueueEmail({
        to: pessoa.email,
        template: 'novo_atendimento',
        data: {
          nomeAtendente: pessoa.nome,
          protocolo,
          nomeContato,
          assunto,
          mensagem,
          url,
        },
      }),
    ),
  )

  return { destinatarios: destinatarios.length }
}
