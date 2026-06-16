import type { RequestContext } from '@server/adapters/next-route'
import { newsletterInscricaoSchema } from '@shared/schemas/newsletter.schema'
import { inscreverNewsletter } from '../service/newsletter.service'

export const newsletterController = {
  async inscrever(ctx: RequestContext) {
    const input = newsletterInscricaoSchema.parse(ctx.body)
    await inscreverNewsletter(input)
    return { data: { message: 'Inscrição realizada com sucesso!' }, status: 201 }
  },
}
