import { prisma } from '@server/lib/db'
import { logAudit } from '@/lib/audit'
import { ServiceError } from './errors'
import type { FaqInput } from '@/lib/schemas/faq'

export async function createFaq(data: FaqInput, userId: string, ip?: string) {
  const faqItem = await prisma.faqItem.create({
    data: {
      pergunta: data.pergunta,
      resposta: data.resposta,
      editalId: data.editalId ?? null,
      ordem: data.ordem,
      publicado: data.publicado,
    },
  })

  await logAudit({
    userId,
    action: 'FAQ_CRIADO',
    entity: 'FaqItem',
    entityId: faqItem.id,
    details: { pergunta: faqItem.pergunta, publicado: faqItem.publicado },
    ip,
  })

  return faqItem
}

export async function updateFaq(id: string, data: FaqInput, userId: string, ip?: string) {
  const existing = await prisma.faqItem.findUnique({ where: { id } })
  if (!existing) throw new ServiceError('NOT_FOUND', 'Item de FAQ não encontrado.')

  const faqItem = await prisma.faqItem.update({
    where: { id },
    data: {
      pergunta: data.pergunta,
      resposta: data.resposta,
      editalId: data.editalId ?? null,
      ordem: data.ordem,
      publicado: data.publicado,
    },
  })

  await logAudit({
    userId,
    action: 'FAQ_ATUALIZADO',
    entity: 'FaqItem',
    entityId: faqItem.id,
    details: { pergunta: faqItem.pergunta, publicado: faqItem.publicado },
    ip,
  })

  return faqItem
}

export async function deleteFaq(id: string, userId: string, ip?: string) {
  const existing = await prisma.faqItem.findUnique({ where: { id } })
  if (!existing) throw new ServiceError('NOT_FOUND', 'Item de FAQ não encontrado.')

  await prisma.faqItem.delete({ where: { id } })

  await logAudit({
    userId,
    action: 'FAQ_EXCLUIDO',
    entity: 'FaqItem',
    entityId: id,
    details: { pergunta: existing.pergunta },
    ip,
  })
}

export async function listFaq(editalId?: string) {
  const where = editalId ? { editalId } : {}
  return prisma.faqItem.findMany({
    where,
    orderBy: { ordem: 'asc' },
  })
}
