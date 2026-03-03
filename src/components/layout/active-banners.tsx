import { prisma } from '@/lib/db'
import Link from 'next/link'

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
    <div className="space-y-0">
      {banners.map((banner) => (
        <div
          key={banner.id}
          className="bg-accent-500 text-white"
          role="alert"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center gap-3 py-2.5 text-sm">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              <p className="font-medium">
                <span className="font-semibold">{banner.titulo}</span>
                {banner.texto && <span className="hidden sm:inline"> — {banner.texto}</span>}
              </p>
              {banner.ctaUrl && banner.ctaLabel && (
                <Link
                  href={banner.ctaUrl}
                  className="shrink-0 rounded-md bg-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/30 transition-colors min-h-[32px] inline-flex items-center"
                >
                  {banner.ctaLabel}
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export { ActiveBanners }
