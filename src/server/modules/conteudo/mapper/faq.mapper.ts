import type { FaqItem } from '@prisma/client'
import type { FaqItemDTO } from '@shared/dtos/faq.dto'

export function toFaqItemDTO(item: FaqItem): FaqItemDTO {
  return {
    id: item.id,
    editalId: item.editalId,
    pergunta: item.pergunta,
    resposta: item.resposta,
    ordem: item.ordem,
    publicado: item.publicado,
    createdAt: item.createdAt.toISOString(),
  }
}
