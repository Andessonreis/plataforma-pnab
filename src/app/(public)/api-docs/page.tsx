import { redirect } from 'next/navigation'
import { auth } from '@server/lib/auth'
import { SwaggerClient } from './swagger-client'

export default async function ApiDocsPage() {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') redirect('/')

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <SwaggerClient />
      </div>
    </main>
  )
}
