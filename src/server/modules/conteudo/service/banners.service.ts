import { logAudit } from '@server/lib/audit'
import type { BannerInput } from '@shared/schemas/banners.schema'
import { bannersRepository } from '../repository/banners.repository'
import { BannerNaoEncontradoError } from '../errors/banners.errors'

export function listBanners() {
  return bannersRepository.list()
}

export async function getBannerById(id: string) {
  const banner = await bannersRepository.findById(id)
  if (!banner) throw new BannerNaoEncontradoError()
  return banner
}

export async function createBanner(data: BannerInput, userId: string, ip?: string) {
  const banner = await bannersRepository.create({
    titulo: data.titulo,
    texto: data.texto,
    ctaLabel: data.ctaLabel ?? null,
    ctaUrl: data.ctaUrl ?? null,
    ativo: data.ativo,
    inicioEm: new Date(data.inicioEm),
    fimEm: new Date(data.fimEm),
  })

  await logAudit({
    userId,
    action: 'BANNER_CRIADO',
    entity: 'Banner',
    entityId: banner.id,
    details: { titulo: banner.titulo, ativo: banner.ativo },
    ip,
  })

  return banner
}

export async function updateBanner(id: string, data: BannerInput, userId: string, ip?: string) {
  const existing = await bannersRepository.findById(id)
  if (!existing) throw new BannerNaoEncontradoError()

  const banner = await bannersRepository.update(id, {
    titulo: data.titulo,
    texto: data.texto,
    ctaLabel: data.ctaLabel ?? null,
    ctaUrl: data.ctaUrl ?? null,
    ativo: data.ativo,
    inicioEm: new Date(data.inicioEm),
    fimEm: new Date(data.fimEm),
  })

  await logAudit({
    userId,
    action: 'BANNER_ATUALIZADO',
    entity: 'Banner',
    entityId: banner.id,
    details: { titulo: banner.titulo, ativo: banner.ativo },
    ip,
  })

  return banner
}

export async function deleteBanner(id: string, userId: string, ip?: string) {
  const existing = await bannersRepository.findById(id)
  if (!existing) throw new BannerNaoEncontradoError()

  await bannersRepository.delete(id)

  await logAudit({
    userId,
    action: 'BANNER_EXCLUIDO',
    entity: 'Banner',
    entityId: id,
    details: { titulo: existing.titulo },
    ip,
  })
}
