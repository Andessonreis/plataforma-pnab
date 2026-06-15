// Fachada pública do módulo de e-mail.
// Implementação: Resend (HTTP API) + templates React Email.
//
// Callers usam apenas `sendEmail`. Para renderizar um template sem enviar
// (útil em testes ou pré-visualização), `renderTemplate` está disponível.

import { checkAllowlist } from './allowlist'
import { sendViaResend } from './client'
import { renderTemplate } from './render'
import type { EmailTemplate } from '@shared/mail/templates'

export type { EmailTemplate, TemplateDataMap } from '@shared/mail/templates'
export { renderTemplate, defaultSubjectFor } from './render'

// Id sentinela retornado quando o envio é descartado pela allowlist de teste.
// Callers que precisem distinguir "enviado" de "descartado" podem checar o prefixo.
export const SKIPPED_EMAIL_ID = 'skipped:test-allowlist'

export interface SendEmailOptions {
  to: string
  template: EmailTemplate
  data: Record<string, unknown>
  /** Sobrescreve o assunto padrão do template. */
  subject?: string
  replyTo?: string
}

export interface SendEmailResult {
  id: string
  /** `true` quando o envio foi descartado pela `EMAIL_TEST_ALLOWLIST`. */
  skipped?: boolean
}

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const gate = checkAllowlist(options.to)
  if (!gate.allowed) {
    console.log({
      event: 'email_skipped_by_allowlist',
      to: options.to.replace(/(.{2}).*(@.*)/, '$1***$2'),
      template: options.template,
      allowlistSize: gate.list?.length ?? 0,
    })
    return { id: SKIPPED_EMAIL_ID, skipped: true }
  }

  const { subject: rendered, html, text } = await renderTemplate(
    options.template,
    options.data,
  )
  // Subject explícito do caller tem prioridade; senão usa o do render
  // (que já considera override do banco quando habilitado).
  const subject = options.subject ?? rendered
  const result = await sendViaResend({
    to: options.to,
    subject,
    html,
    text,
    replyTo: options.replyTo,
  })
  return { id: result.id }
}
