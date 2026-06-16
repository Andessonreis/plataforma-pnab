import type { EmailTemplateOverride, Prisma } from '@prisma/client'
import { prisma } from '@server/lib/db'

const updatedByInclude = {
  updatedBy: { select: { id: true, nome: true, email: true } },
} satisfies Prisma.EmailTemplateOverrideInclude

export type OverrideWithUpdatedBy = Prisma.EmailTemplateOverrideGetPayload<{
  include: typeof updatedByInclude
}>

export const emailTemplatesRepository = {
  list(): Promise<OverrideWithUpdatedBy[]> {
    return prisma.emailTemplateOverride.findMany({
      orderBy: { updatedAt: 'desc' },
      include: updatedByInclude,
    })
  },

  findByKey(key: string): Promise<OverrideWithUpdatedBy | null> {
    return prisma.emailTemplateOverride.findUnique({
      where: { key },
      include: updatedByInclude,
    })
  },

  findRawByKey(key: string): Promise<EmailTemplateOverride | null> {
    return prisma.emailTemplateOverride.findUnique({ where: { key } })
  },

  async findUserEmail(userId: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    })
    return user?.email ?? null
  },

  upsert(
    key: string,
    data: { subject: string; body: string; enabled: boolean; updatedById: string },
  ): Promise<EmailTemplateOverride> {
    return prisma.emailTemplateOverride.upsert({
      where: { key },
      create: {
        key,
        subject: data.subject,
        body: data.body,
        enabled: data.enabled,
        updatedById: data.updatedById,
      },
      update: {
        subject: data.subject,
        body: data.body,
        enabled: data.enabled,
        updatedById: data.updatedById,
      },
    })
  },
}
