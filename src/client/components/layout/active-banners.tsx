import { prisma } from '@/lib/db'
import { BannerStrip } from './banner-strip'

async function ActiveBanners() {
  const now = new Date()

  const banners = await prisma.banner.findMany({
    where: {
      ativo: true,
      inicioEm: { lte: now },
      fimEm: { gte: now },
    },
    orderBy: { createdAt: 'desc' },
    take: 3,
  })

  if (banners.length === 0) return null

  return (
    <BannerStrip
      banners={banners.map((b) => ({
        id: b.id,
        titulo: b.titulo,
        texto: b.texto,
        ctaLabel: b.ctaLabel,
        ctaUrl: b.ctaUrl,
      }))}
    />
  )
}

export { ActiveBanners }
