import { Prisma, type UserRole } from '@prisma/client'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { ServiceError } from './errors'
import type { SlideInput } from '@/lib/schemas/slide-destaque'

/** Quem cuida da abertura da home: conteúdo institucional é da Comunicação. */
export const ROLES_SLIDES: UserRole[] = ['SUPER_ADMIN', 'COMUNICACAO']

interface Autor {
  userId: string
  ip?: string
}

/**
 * Campos gravados a partir do formulário. A peça só é guardada no formato
 * PECA: ao trocar um slide para ARTE o conteúdo editorial antigo é limpo,
 * para não sobrar dado órfão que reapareceria se o formato voltasse.
 */
function paraGravacao(data: SlideInput) {
  return {
    formato: data.formato,
    titulo: data.titulo,
    descricao: data.descricao,
    imagemUrl: data.imagemUrl,
    peca: data.formato === 'PECA' && data.peca ? (data.peca as Prisma.InputJsonObject) : Prisma.DbNull,
    ctaLabel: data.ctaLabel,
    ctaUrl: data.ctaUrl,
    ordem: data.ordem,
    ativo: data.ativo,
    inicioEm: data.inicioEm ? new Date(data.inicioEm) : null,
    fimEm: data.fimEm ? new Date(data.fimEm) : null,
  }
}

async function exigirSlide(id: string) {
  const slide = await prisma.slideDestaque.findUnique({ where: { id } })
  if (!slide) throw new ServiceError('NOT_FOUND', 'Slide não encontrado.')
  return slide
}

export function listarSlides() {
  return prisma.slideDestaque.findMany({ orderBy: { ordem: 'asc' } })
}

export async function criarSlide(data: SlideInput, autor: Autor) {
  const slide = await prisma.slideDestaque.create({ data: paraGravacao(data) })
  await logAudit({
    userId: autor.userId,
    action: 'SLIDE_CRIADO',
    entity: 'SlideDestaque',
    entityId: slide.id,
    details: { titulo: slide.titulo, formato: data.formato, ativo: slide.ativo },
    ip: autor.ip,
  })
  return slide
}

export async function atualizarSlide(id: string, data: SlideInput, autor: Autor) {
  await exigirSlide(id)
  const slide = await prisma.slideDestaque.update({ where: { id }, data: paraGravacao(data) })
  await logAudit({
    userId: autor.userId,
    action: 'SLIDE_ATUALIZADO',
    entity: 'SlideDestaque',
    entityId: slide.id,
    details: { titulo: slide.titulo, formato: data.formato, ativo: slide.ativo },
    ip: autor.ip,
  })
  return slide
}

export async function excluirSlide(id: string, autor: Autor) {
  const existente = await exigirSlide(id)
  await prisma.slideDestaque.delete({ where: { id } })
  await logAudit({
    userId: autor.userId,
    action: 'SLIDE_EXCLUIDO',
    entity: 'SlideDestaque',
    entityId: id,
    details: { titulo: existente.titulo },
    ip: autor.ip,
  })
}
