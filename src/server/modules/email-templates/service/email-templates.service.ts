import { AUDIT_ACTIONS, logAudit } from '@server/lib/audit'
import { sendViaResend } from '@server/lib/mail/client'
import { renderOverride, sanitizeBody } from '@server/lib/mail/db-template'
import { renderTemplate } from '@server/lib/mail/render'
import { getSampleData, TEMPLATE_META } from '@shared/mail/placeholders'
import type { EmailTemplate } from '@shared/mail/templates'
import type {
  EmailTemplatePreviewInput,
  EmailTemplateTestSendInput,
  EmailTemplateUpsertInput,
} from '@shared/schemas/email-templates.schema'
import { emailTemplatesRepository } from '../repository/email-templates.repository'
import {
  SemEmailCadastradoError,
  TemplateDesconhecidoError,
} from '../errors/email-templates.errors'

function assertKnownTemplate(key: string): asserts key is EmailTemplate {
  if (!Object.prototype.hasOwnProperty.call(TEMPLATE_META, key)) {
    throw new TemplateDesconhecidoError()
  }
}

export async function listEmailTemplates() {
  const overrides = await emailTemplatesRepository.list()
  const byKey = new Map(overrides.map((o) => [o.key, o]))

  return (Object.keys(TEMPLATE_META) as EmailTemplate[]).map((key) => {
    const meta = TEMPLATE_META[key]
    const override = byKey.get(key)
    return {
      key,
      label: meta.label,
      description: meta.description,
      sensitive: meta.sensitive ?? false,
      override: override
        ? {
            enabled: override.enabled,
            updatedAt: override.updatedAt,
            updatedBy: override.updatedBy,
          }
        : null,
    }
  })
}

export async function getEmailTemplate(key: string) {
  assertKnownTemplate(key)

  const override = await emailTemplatesRepository.findByKey(key)
  const meta = TEMPLATE_META[key]

  return {
    key,
    meta: {
      label: meta.label,
      description: meta.description,
      sensitive: meta.sensitive ?? false,
      placeholders: meta.placeholders,
    },
    override: override
      ? {
          subject: override.subject,
          body: override.body,
          enabled: override.enabled,
          updatedAt: override.updatedAt,
          updatedBy: override.updatedBy,
        }
      : null,
  }
}

export async function updateEmailTemplate(
  key: string,
  data: EmailTemplateUpsertInput,
  userId: string,
  ip?: string,
) {
  assertKnownTemplate(key)

  const sanitized = sanitizeBody(data.body)
  const existing = await emailTemplatesRepository.findRawByKey(key)

  const saved = await emailTemplatesRepository.upsert(key, {
    subject: data.subject,
    body: sanitized,
    enabled: data.enabled,
    updatedById: userId,
  })

  const wasEnabled = existing?.enabled ?? false
  if (wasEnabled !== data.enabled) {
    await logAudit({
      userId,
      action: data.enabled
        ? AUDIT_ACTIONS.EMAIL_TEMPLATE_HABILITADO
        : AUDIT_ACTIONS.EMAIL_TEMPLATE_DESABILITADO,
      entity: 'EmailTemplateOverride',
      entityId: saved.id,
      details: { key, enabled: data.enabled },
      ip,
    })
  }
  if (!existing || existing.subject !== data.subject || existing.body !== sanitized) {
    await logAudit({
      userId,
      action: AUDIT_ACTIONS.EMAIL_TEMPLATE_ATUALIZADO,
      entity: 'EmailTemplateOverride',
      entityId: saved.id,
      details: { key, subjectLen: data.subject.length, bodyLen: sanitized.length },
      ip,
    })
  }

  return { id: saved.id, key: saved.key, enabled: saved.enabled, updatedAt: saved.updatedAt }
}

export async function previewEmailTemplate(key: string, input: EmailTemplatePreviewInput) {
  assertKnownTemplate(key)

  const sample = getSampleData(key)

  let rendered: { subject: string; html: string }
  if (input.subject && input.body) {
    rendered = await renderOverride(
      { subject: input.subject, body: sanitizeBody(input.body) },
      sample,
    )
  } else {
    const r = await renderTemplate(key, sample)
    rendered = { subject: r.subject, html: r.html }
  }

  return { subject: rendered.subject, html: rendered.html, sample }
}

export async function testSendEmailTemplate(
  key: string,
  input: EmailTemplateTestSendInput,
  to: string | null,
) {
  assertKnownTemplate(key)

  if (!to) {
    throw new SemEmailCadastradoError()
  }

  const sample = getSampleData(key)

  let subject: string
  let html: string
  let text: string

  if (input.subject && input.body) {
    const rendered = await renderOverride(
      { subject: input.subject, body: sanitizeBody(input.body) },
      sample,
    )
    subject = rendered.subject
    html = rendered.html
    text = rendered.text
  } else {
    const rendered = await renderTemplate(key, sample)
    subject = rendered.subject
    html = rendered.html
    text = rendered.text
  }

  const result = await sendViaResend({
    to,
    subject: `[TESTE] ${subject}`,
    html,
    text: `[ENVIO DE TESTE — admin]\n\n${text}`,
  })

  return { id: result.id, to, message: `E-mail de teste enviado para ${to}.` }
}
