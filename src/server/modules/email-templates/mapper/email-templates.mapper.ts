import type { PlaceholderSpec } from '@shared/mail/placeholders'

type UpdatedBy = { id: string; nome: string; email: string } | null

type OverrideSummary = {
  enabled: boolean
  updatedAt: Date
  updatedBy: UpdatedBy
} | null

type ListItem = {
  key: string
  label: string
  description: string
  sensitive: boolean
  override: OverrideSummary
}

export type EmailTemplateListItemDTO = {
  key: string
  label: string
  description: string
  sensitive: boolean
  override: {
    enabled: boolean
    updatedAt: string
    updatedBy: UpdatedBy
  } | null
}

export function toEmailTemplateListItemDTO(item: ListItem): EmailTemplateListItemDTO {
  return {
    key: item.key,
    label: item.label,
    description: item.description,
    sensitive: item.sensitive,
    override: item.override
      ? {
          enabled: item.override.enabled,
          updatedAt: item.override.updatedAt.toISOString(),
          updatedBy: item.override.updatedBy,
        }
      : null,
  }
}

type Detail = {
  key: string
  meta: {
    label: string
    description: string
    sensitive: boolean
    placeholders: PlaceholderSpec[]
  }
  override: {
    subject: string
    body: string
    enabled: boolean
    updatedAt: Date
    updatedBy: UpdatedBy
  } | null
}

export type EmailTemplateDetailDTO = {
  key: string
  meta: {
    label: string
    description: string
    sensitive: boolean
    placeholders: PlaceholderSpec[]
  }
  override: {
    subject: string
    body: string
    enabled: boolean
    updatedAt: string
    updatedBy: UpdatedBy
  } | null
}

export function toEmailTemplateDetailDTO(detail: Detail): EmailTemplateDetailDTO {
  return {
    key: detail.key,
    meta: detail.meta,
    override: detail.override
      ? {
          subject: detail.override.subject,
          body: detail.override.body,
          enabled: detail.override.enabled,
          updatedAt: detail.override.updatedAt.toISOString(),
          updatedBy: detail.override.updatedBy,
        }
      : null,
  }
}

export function toEmailTemplateSavedDTO(saved: {
  id: string
  key: string
  enabled: boolean
  updatedAt: Date
}) {
  return {
    id: saved.id,
    key: saved.key,
    enabled: saved.enabled,
    updatedAt: saved.updatedAt.toISOString(),
  }
}
