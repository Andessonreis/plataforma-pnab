import type { EvaluationTemplate, Prisma } from '@prisma/client'
import { prisma } from '@server/lib/db'

export const templatesAvaliacaoRepository = {
  list(includeInactive: boolean): Promise<EvaluationTemplate[]> {
    return prisma.evaluationTemplate.findMany({
      where: includeInactive ? {} : { ativo: true },
      orderBy: { ordem: 'asc' },
    })
  },

  findById(id: string): Promise<EvaluationTemplate | null> {
    return prisma.evaluationTemplate.findUnique({ where: { id } })
  },

  findByNome(nome: string, exceptId?: string): Promise<EvaluationTemplate | null> {
    return prisma.evaluationTemplate.findFirst({
      where: exceptId ? { nome, id: { not: exceptId } } : { nome },
    })
  },

  findLast(): Promise<EvaluationTemplate | null> {
    return prisma.evaluationTemplate.findFirst({ orderBy: { ordem: 'desc' } })
  },

  create(data: Prisma.EvaluationTemplateCreateInput): Promise<EvaluationTemplate> {
    return prisma.evaluationTemplate.create({ data })
  },

  update(id: string, data: Prisma.EvaluationTemplateUpdateInput): Promise<EvaluationTemplate> {
    return prisma.evaluationTemplate.update({ where: { id }, data })
  },

  delete(id: string): Promise<EvaluationTemplate> {
    return prisma.evaluationTemplate.delete({ where: { id } })
  },
}
