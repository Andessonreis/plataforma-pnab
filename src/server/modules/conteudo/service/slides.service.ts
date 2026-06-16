import { logAudit } from '@server/lib/audit'
import type { SlideInput } from '@shared/schemas/slides.schema'
import { slidesRepository } from '../repository/slides.repository'
import { SlideNaoEncontradoError } from '../errors/slides.errors'

export function listSlides() {
  return slidesRepository.list()
}

export async function getSlideById(id: string) {
  const slide = await slidesRepository.findById(id)
  if (!slide) throw new SlideNaoEncontradoError()
  return slide
}

export async function createSlide(data: SlideInput, userId: string, ip?: string) {
  const slide = await slidesRepository.create({
    titulo: data.titulo,
    descricao: data.descricao ?? null,
    imagemUrl: data.imagemUrl ?? null,
    ctaLabel: data.ctaLabel ?? null,
    ctaUrl: data.ctaUrl ?? null,
    ordem: data.ordem,
    ativo: data.ativo,
    inicioEm: data.inicioEm ? new Date(data.inicioEm) : null,
    fimEm: data.fimEm ? new Date(data.fimEm) : null,
  })

  await logAudit({
    userId,
    action: 'SLIDE_CRIADO',
    entity: 'SlideDestaque',
    entityId: slide.id,
    details: { titulo: slide.titulo, ativo: slide.ativo },
    ip,
  })

  return slide
}

export async function updateSlide(id: string, data: SlideInput, userId: string, ip?: string) {
  const existing = await slidesRepository.findById(id)
  if (!existing) throw new SlideNaoEncontradoError()

  const slide = await slidesRepository.update(id, {
    titulo: data.titulo,
    descricao: data.descricao ?? null,
    imagemUrl: data.imagemUrl ?? null,
    ctaLabel: data.ctaLabel ?? null,
    ctaUrl: data.ctaUrl ?? null,
    ordem: data.ordem,
    ativo: data.ativo,
    inicioEm: data.inicioEm ? new Date(data.inicioEm) : null,
    fimEm: data.fimEm ? new Date(data.fimEm) : null,
  })

  await logAudit({
    userId,
    action: 'SLIDE_ATUALIZADO',
    entity: 'SlideDestaque',
    entityId: slide.id,
    details: { titulo: slide.titulo, ativo: slide.ativo },
    ip,
  })

  return slide
}

export async function deleteSlide(id: string, userId: string, ip?: string) {
  const existing = await slidesRepository.findById(id)
  if (!existing) throw new SlideNaoEncontradoError()

  await slidesRepository.delete(id)

  await logAudit({
    userId,
    action: 'SLIDE_EXCLUIDO',
    entity: 'SlideDestaque',
    entityId: id,
    details: { titulo: existing.titulo },
    ip,
  })
}
