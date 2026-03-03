import { Suspense } from 'react'
import { Header, Footer, CookieBanner } from '@/components/layout'
import { ActiveBanners } from '@/components/layout'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <Suspense fallback={null}>
        <ActiveBanners />
      </Suspense>
      <main className="flex-1">{children}</main>
      <Footer />
      <CookieBanner />
    </div>
  )
}
