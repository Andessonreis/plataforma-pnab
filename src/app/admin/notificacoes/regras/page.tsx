import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@server/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@server/lib/db'
import { Card, Badge, Button, EmptyState, FadeIn, IconPlus, IconSettings } from '@client/components/ui'
import { TRIGGER_REGISTRY } from '@/lib/notifications/triggers'

export const metadata: Metadata = {
  title: 'Regras Automáticas — Portal PNAB Irecê',
}

export default async function AdminRegrasPage() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/')

  const rules = await prisma.notificationRule.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { campaigns: true } } },
  })

  return (
    <section>
      <FadeIn>
        <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
          <div className="min-w-0">
            <Link
              href="/admin/notificacoes"
              className="text-xs text-brand-600 hover:text-brand-700 font-medium"
            >
              ← Notificações
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Regras Automáticas</h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1">{rules.length} regra(s)</p>
          </div>
          <Button href="/admin/notificacoes/regras/nova" size="sm">
            <IconPlus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Nova Regra</span>
            <span className="sm:hidden">Nova</span>
          </Button>
        </div>
      </FadeIn>

      {rules.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconSettings className="h-8 w-8 text-slate-400" />}
            title="Nenhuma regra configurada"
            description="Crie a primeira regra automática. Toda regra nasce desativada — você precisa habilitar manualmente."
            action={{ label: 'Nova Regra', href: '/admin/notificacoes/regras/nova' }}
          />
        </Card>
      ) : (
        <Card padding="sm" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Nome</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Trigger</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Disparos</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => {
                  const def = TRIGGER_REGISTRY[r.trigger]
                  return (
                    <tr
                      key={r.id}
                      className="border-t border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-900">{r.nome}</p>
                        {r.descricao && (
                          <p className="text-xs text-slate-500 line-clamp-1">{r.descricao}</p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700">
                        {def?.label ?? r.trigger}
                        {def && !def.implementado && (
                          <Badge variant="warning" className="ml-2">
                            em breve
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={r.ativo ? 'success' : 'neutral'}>
                          {r.ativo ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">{r._count.campaigns}</td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/notificacoes/regras/${r.id}`}
                          className="text-brand-600 hover:text-brand-700 font-medium text-xs"
                        >
                          Configurar
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </section>
  )
}
