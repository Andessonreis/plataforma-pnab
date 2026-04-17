import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, PageHeader, IconDocument, IconTag, IconClipboard } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Configurações — Cultura e Turismo Irecê',
}

const configCards = [
  {
    title: 'Tipos de Anexo',
    description: 'Gerencie os tipos de documentos dos editais e os anexos que proponentes enviam nas inscrições.',
    href: '/admin/configuracoes/tipos-anexo',
    icon: <IconDocument className="h-6 w-6" />,
  },
  {
    title: 'Categorias Culturais',
    description: 'Gerencie as categorias disponíveis para os editais (Música, Dança, Teatro, etc.).',
    href: '/admin/configuracoes/categorias',
    icon: <IconTag className="h-6 w-6" />,
  },
  {
    title: 'Templates de Avaliação',
    description: 'Crie e gerencie modelos reutilizáveis de critérios de avaliação para os editais.',
    href: '/admin/configuracoes/templates-avaliacao',
    icon: <IconClipboard className="h-6 w-6" />,
  },
]

export default async function ConfiguracoesPage() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        subtitle="Configurações gerais da plataforma."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {configCards.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card padding="sm" className="sm:p-6 hover:border-brand-300 hover:shadow-md transition-all cursor-pointer h-full">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                  {card.icon}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900">{card.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{card.description}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
