import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import type { UserRole } from '@prisma/client'

const ROLES_PERMITIDOS: UserRole[] = ['ADMIN', 'ATENDIMENTO', 'HABILITADOR', 'AVALIADOR']

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session) redirect('/login')

  const role = session.user.role as UserRole
  if (!ROLES_PERMITIDOS.includes(role)) redirect('/')

  return (
    <div className="flex min-h-screen">
      {/* <SidebarAdmin role={role} /> */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
