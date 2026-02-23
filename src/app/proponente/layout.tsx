import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function ProponenteLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="flex min-h-screen">
      {/* <SidebarProponente /> */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
