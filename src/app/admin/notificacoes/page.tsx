import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, FadeIn, Button } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Notificações — Portal PNAB Irecê',
}

export default async function AdminNotificacoesPage() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/')

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const [rascunhos, enviadas, regrasAtivas, regrasInativas, ultimas24h] = await Promise.all([
    prisma.notificationCampaign.count({ where: { status: 'RASCUNHO' } }),
    prisma.notificationCampaign.count({ where: { status: 'ENVIADA' } }),
    prisma.notificationRule.count({ where: { ativo: true } }),
    prisma.notificationRule.count({ where: { ativo: false } }),
    prisma.notification.count({ where: { createdAt: { gte: yesterday } } }),
  ])

  const emailEnabled = process.env.NOTIFICATION_EMAIL_ENABLED === 'true'

  return (
    <section>
      <FadeIn>
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Notificações</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Composição manual, regras automáticas e histórico de entregas.
          </p>
        </div>
      </FadeIn>

      {!emailEnabled && (
        <Card padding="sm" className="sm:p-4 mb-4 bg-amber-50 border-amber-200">
          <p className="text-xs sm:text-sm text-amber-900">
            <strong>Canal de email desativado</strong> — {' '}
            <code className="text-[11px] bg-amber-100 px-1 rounded">NOTIFICATION_EMAIL_ENABLED=false</code>.
            Notificações marcadas pra email ficam registradas com{' '}
            <code className="text-[11px] bg-amber-100 px-1 rounded">emailErro=&quot;disabled&quot;</code> e não são enviadas. Trocar a variável de ambiente quando o domínio Resend estiver verificado.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card padding="sm" className="sm:p-5">
          <p className="text-xs text-slate-500">Campanhas em rascunho</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{rascunhos}</p>
          <Link href="/admin/notificacoes/campanhas?status=RASCUNHO" className="text-xs text-brand-600 hover:text-brand-700 mt-2 inline-block">
            Ver lista →
          </Link>
        </Card>
        <Card padding="sm" className="sm:p-5">
          <p className="text-xs text-slate-500">Campanhas enviadas</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{enviadas}</p>
          <Link href="/admin/notificacoes/campanhas?status=ENVIADA" className="text-xs text-brand-600 hover:text-brand-700 mt-2 inline-block">
            Ver lista →
          </Link>
        </Card>
        <Card padding="sm" className="sm:p-5">
          <p className="text-xs text-slate-500">Regras automáticas</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {regrasAtivas} <span className="text-sm font-normal text-slate-500">de {regrasAtivas + regrasInativas}</span>
          </p>
          <Link href="/admin/notificacoes/regras" className="text-xs text-brand-600 hover:text-brand-700 mt-2 inline-block">
            Configurar →
          </Link>
        </Card>
        <Card padding="sm" className="sm:p-5 lg:col-span-3">
          <p className="text-xs text-slate-500">Notificações entregues nas últimas 24h</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{ultimas24h}</p>
          <Link href="/admin/notificacoes/historico" className="text-xs text-brand-600 hover:text-brand-700 mt-2 inline-block">
            Histórico completo →
          </Link>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button href="/admin/notificacoes/campanhas/nova">Nova Campanha</Button>
        <Button href="/admin/notificacoes/regras/nova" variant="ghost">
          Nova Regra
        </Button>
      </div>
    </section>
  )
}
