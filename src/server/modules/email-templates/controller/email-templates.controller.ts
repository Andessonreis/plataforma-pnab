import type { RequestContext } from '@server/adapters/next-route'
import { ForbiddenError } from '@server/lib/http/errors'
import { resolveApiCaller, callerHasRole, ipFromHeaders } from '@server/lib/auth/api-caller'
import {
  emailTemplatePreviewSchema,
  emailTemplateTestSendSchema,
  emailTemplateUpsertSchema,
} from '@shared/schemas/email-templates.schema'
import {
  getEmailTemplate,
  listEmailTemplates,
  previewEmailTemplate,
  testSendEmailTemplate,
  updateEmailTemplate,
} from '../service/email-templates.service'
import { emailTemplatesRepository } from '../repository/email-templates.repository'
import {
  toEmailTemplateDetailDTO,
  toEmailTemplateListItemDTO,
  toEmailTemplateSavedDTO,
} from '../mapper/email-templates.mapper'

async function requireAdmin(ctx: RequestContext) {
  const caller = await resolveApiCaller(ctx.headers)
  if (!callerHasRole(caller, 'ADMIN')) throw new ForbiddenError()
  return caller
}

export const emailTemplatesController = {
  async list(ctx: RequestContext) {
    await requireAdmin(ctx)
    const items = await listEmailTemplates()
    return { data: items.map(toEmailTemplateListItemDTO) }
  },

  async detail(ctx: RequestContext) {
    await requireAdmin(ctx)
    const detail = await getEmailTemplate(ctx.params.id)
    return { data: toEmailTemplateDetailDTO(detail) }
  },

  async update(ctx: RequestContext) {
    const caller = await requireAdmin(ctx)
    const data = emailTemplateUpsertSchema.parse(ctx.body)
    const saved = await updateEmailTemplate(
      ctx.params.id,
      data,
      caller.userId,
      ipFromHeaders(ctx.headers),
    )
    return { data: toEmailTemplateSavedDTO(saved) }
  },

  async preview(ctx: RequestContext) {
    await requireAdmin(ctx)
    const input = emailTemplatePreviewSchema.parse(ctx.body ?? {})
    const rendered = await previewEmailTemplate(ctx.params.id, input)
    return { data: rendered }
  },

  async testSend(ctx: RequestContext) {
    const caller = await requireAdmin(ctx)
    const input = emailTemplateTestSendSchema.parse(ctx.body ?? {})
    const to = await emailTemplatesRepository.findUserEmail(caller.userId)
    const result = await testSendEmailTemplate(ctx.params.id, input, to)
    return { data: { id: result.id, to: result.to, message: result.message } }
  },
}
