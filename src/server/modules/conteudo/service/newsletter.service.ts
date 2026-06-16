import type { NewsletterInscricaoInput } from '@shared/schemas/newsletter.schema'
import { newsletterRepository } from '../repository/newsletter.repository'
import { NewsletterJaInscritoError } from '../errors/newsletter.errors'

export async function inscreverNewsletter(input: NewsletterInscricaoInput) {
  const existing = await newsletterRepository.findByEmail(input.email)

  // Newsletter pública de portal de governo — feedback claro vence
  // privacidade contra enumeration neste contexto (#83).
  if (existing?.ativo) {
    throw new NewsletterJaInscritoError()
  }

  if (existing && !existing.ativo) {
    await newsletterRepository.reactivate(input.email, input.nome)
    return
  }

  await newsletterRepository.create(input.nome, input.email)
}
