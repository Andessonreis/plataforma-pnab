import { logAudit } from '@server/lib/audit'
import type { FaqInput } from '@shared/schemas/faq.schema'
import { faqRepository } from '../repository/faq.repository'
import { FaqNaoEncontradoError } from '../errors/faq.errors'

export function listFaq(editalId?: string) {
  return faqRepository.list(editalId)
}

export async function createFaq(data: FaqInput, userId: string, ip?: string) {
  const faqItem = await faqRepository.create({
    pergunta: data.pergunta,
    resposta: data.resposta,
    editalId: data.editalId ?? null,
    ordem: data.ordem,
    publicado: data.publicado,
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
  const existing = await faqRepository.findById(id)
  if (!existing) throw new FaqNaoEncontradoError()

  const faqItem = await faqRepository.update(id, {
    pergunta: data.pergunta,
    resposta: data.resposta,
    editalId: data.editalId ?? null,
    ordem: data.ordem,
    publicado: data.publicado,
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
  const existing = await faqRepository.findById(id)
  if (!existing) throw new FaqNaoEncontradoError()

  await faqRepository.delete(id)

  await logAudit({
    userId,
    action: 'FAQ_EXCLUIDO',
    entity: 'FaqItem',
    entityId: id,
    details: { pergunta: existing.pergunta },
    ip,
  })
}
