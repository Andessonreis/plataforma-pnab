import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { sanitizeContent } from '@/lib/sanitize'
import { generateEditalSlug } from '@/lib/utils/slug'
import { ServiceError } from './errors'
import type { EditalInput, EditalAcessivelInput } from '@/lib/schemas/edital'

export async function createEdital(data: EditalInput, userId: string, ip?: string) {
  let slug = generateEditalSlug(data.titulo, data.ano)
  const existingSlug = await prisma.edital.findUnique({ where: { slug } })
  if (existingSlug) {
    slug = `${slug}-${Date.now().toString(36)}`
  }

  const edital = await prisma.edital.create({
    data: {
      titulo: data.titulo,
      slug,
      ano: data.ano,
      status: data.status,
      resumo: data.resumo ?? null,
      valorTotal: data.valorTotal ?? null,
      categorias: data.categorias,
      acoesAfirmativas: data.acoesAfirmativas ?? null,
      regrasElegibilidade: data.regrasElegibilidade ?? null,
      cronograma: data.cronograma,
      camposFormulario: data.camposFormulario as unknown as import('@prisma/client').Prisma.InputJsonValue,
      vagasContemplados: data.vagasContemplados ?? null,
      vagasSuplentes: data.vagasSuplentes ?? null,
      ...(data.status !== 'RASCUNHO' ? { publishedAt: new Date() } : {}),
    },
  })

  await logAudit({
    userId,
    action: 'EDITAL_CRIADO',
    entity: 'Edital',
    entityId: edital.id,
    details: { titulo: edital.titulo, status: edital.status },
    ip,
  })

  return edital
}

export async function updateEdital(id: string, data: EditalInput, userId: string, ip?: string) {
  const existing = await prisma.edital.findUnique({ where: { id } })
  if (!existing) throw new ServiceError('NOT_FOUND', 'Edital não encontrado.')

  let slug = existing.slug
  if (data.titulo !== existing.titulo) {
    slug = generateEditalSlug(data.titulo, data.ano)
    const slugExists = await prisma.edital.findFirst({ where: { slug, id: { not: id } } })
    if (slugExists) {
      slug = `${slug}-${Date.now().toString(36)}`
    }
  }

  const isPublishing = existing.status === 'RASCUNHO' && data.status !== 'RASCUNHO'
  const publishedAt = isPublishing && !existing.publishedAt ? new Date() : undefined

  const edital = await prisma.edital.update({
    where: { id },
    data: {
      titulo: data.titulo,
      slug,
      ano: data.ano,
      status: data.status,
      resumo: data.resumo ?? null,
      valorTotal: data.valorTotal ?? null,
      categorias: data.categorias,
      acoesAfirmativas: data.acoesAfirmativas ?? null,
      regrasElegibilidade: data.regrasElegibilidade ?? null,
      cronograma: data.cronograma,
      camposFormulario: data.camposFormulario as unknown as import('@prisma/client').Prisma.InputJsonValue,
      vagasContemplados: data.vagasContemplados ?? null,
      vagasSuplentes: data.vagasSuplentes ?? null,
      ...(publishedAt ? { publishedAt } : {}),
    },
  })

  await logAudit({
    userId,
    action: 'EDITAL_ATUALIZADO',
    entity: 'Edital',
    entityId: edital.id,
    details: { titulo: edital.titulo, status: edital.status },
    ip,
  })

  return edital
}

export async function getEditalById(id: string) {
  const edital = await prisma.edital.findUnique({
    where: { id },
    include: { arquivos: true },
  })
  if (!edital) throw new ServiceError('NOT_FOUND', 'Edital não encontrado.')
  return edital
}

export async function getEditalBySlug(slug: string) {
  const edital = await prisma.edital.findUnique({
    where: { slug },
    include: { arquivos: true, faqItems: { where: { publicado: true }, orderBy: { ordem: 'asc' } } },
  })
  if (!edital) throw new ServiceError('NOT_FOUND', 'Edital não encontrado.')
  return edital
}

export async function listEditais(page: number, pageSize: number, status?: string) {
  const where = status ? { status: status as import('@prisma/client').EditalStatus } : {}
  const [data, total] = await Promise.all([
    prisma.edital.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.edital.count({ where }),
  ])

  return { data, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } }
}

export async function updateAcessivel(id: string, data: EditalAcessivelInput, userId: string, ip?: string) {
  const edital = await prisma.edital.findUnique({ where: { id }, select: { id: true } })
  if (!edital) throw new ServiceError('NOT_FOUND', 'Edital não encontrado.')

  const sanitized = sanitizeContent(data.conteudoAcessivel)

  await prisma.edital.update({
    where: { id },
    data: { conteudoAcessivel: sanitized },
  })

  await logAudit({
    userId,
    action: 'EDITAL_ATUALIZADO',
    entity: 'Edital',
    entityId: id,
    details: { campo: 'conteudoAcessivel' },
    ip,
  })
}
