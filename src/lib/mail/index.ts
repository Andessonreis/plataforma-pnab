// Fachada pública do módulo de e-mail.
// Implementação: Resend (HTTP API) + templates React Email.
//
// Callers usam apenas `sendEmail`. Para renderizar um template sem enviar
// (útil em testes ou pré-visualização), `renderTemplate` está disponível.

import { sendViaResend } from './client'
import { defaultSubjectFor, renderTemplate } from './render'
import type { EmailTemplate } from './templates'

export type { EmailTemplate, TemplateDataMap } from './templates'
export { renderTemplate, defaultSubjectFor } from './render'

export interface SendEmailOptions {
  to: string
  template: EmailTemplate
  data: Record<string, unknown>
  /** Sobrescreve o assunto padrão do template. */
  subject?: string
  replyTo?: string
}

export async function sendEmail(options: SendEmailOptions): Promise<{ id: string }> {
  const { html, text } = await renderTemplate(options.template, options.data)
  const subject = options.subject ?? defaultSubjectFor(options.template, options.data)
  return sendViaResend({
    to: options.to,
    subject,
    html,
    text,
    replyTo: options.replyTo,
  })
}
