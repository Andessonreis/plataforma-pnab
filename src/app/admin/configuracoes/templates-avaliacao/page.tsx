import type { Metadata } from 'next'
import { auth } from '@server/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@server/lib/db'
import { PageHeader } from '@client/components/ui'
import { TemplatesManager } from './templates-manager'

export const metadata: Metadata = {
  title: 'Templates de Avaliação — Portal PNAB Irecê',
}

export default async function TemplatesAvaliacaoPage() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/')

  const rawTemplates = await prisma.evaluationTemplate.findMany({
    orderBy: { ordem: 'asc' },
  })

  const templates = rawTemplates.map(t => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Templates de Avaliação"
        subtitle="Modelos reutilizáveis de critérios de avaliação para editais."
        breadcrumbs={[
          { label: 'Configurações', href: '/admin/configuracoes' },
          { label: 'Templates de Avaliação' },
        ]}
      />

      <TemplatesManager initialTemplates={templates} />
    </div>
  )
}
