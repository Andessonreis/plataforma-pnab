import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
  Badge,
  Card,
  FadeIn,
  IconChatBubble,
  IconClock,
  IconMail,
} from '@/components/ui'

export const metadata: Metadata = {
  title: 'Notificações — Portal PNAB Irecê',
}

const STATUS_LABELS: Record<string, { label: string; variant: 'success' | 'warning' | 'neutral' | 'error' }> = {
  RASCUNHO: { label: 'Rascunho', variant: 'neutral' },
  ENVIANDO: { label: 'Enviando', variant: 'warning' },
  ENVIADA: { label: 'Enviada', variant: 'success' },
  CANCELADA: { label: 'Cancelada', variant: 'neutral' },
  FALHA: { label: 'Falha', variant: 'error' },
}

function formatRelative(date: Date): string {
  const now = Date.now()
  const diff = now - date.getTime()
  const minutes = Math.round(diff / 60_000)
  if (minutes < 1) return 'agora há pouco'
  if (minutes < 60) return `há ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `há ${hours} h`
  const days = Math.round(hours / 24)
  if (days < 30) return `há ${days} dia${days > 1 ? 's' : ''}`
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Sao_Paulo' })
}

export default async function AdminNotificacoesPage() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/')

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const [recentCampanhas, activeRules, ultimas24h] = await Promise.all([
    prisma.notificationCampaign.findMany({
      orderBy: [{ sentAt: 'desc' }, { createdAt: 'desc' }],
      take: 5,
      select: {
        id: true,
        titulo: true,
        status: true,
        totalAlvo: true,
        totalEnviado: true,
        sentAt: true,
        createdAt: true,
      },
    }),
    prisma.notificationRule.findMany({
      where: { ativo: true },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: { id: true, nome: true, trigger: true, updatedAt: true },
    }),
    prisma.notification.count({ where: { createdAt: { gte: yesterday } } }),
  ])

  return (
    <section>
      <FadeIn>
        <div className="mb-5 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Notificações</h1>
          <p className="text-sm text-slate-600 mt-1">
            Avise os proponentes — agora ou automaticamente quando algo acontecer.
          </p>
        </div>
      </FadeIn>

      {/* Ações principais — o que admin quer fazer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <Link
          href="/admin/notificacoes/campanhas/nova"
          className="group rounded-xl border border-slate-200 bg-white p-5 hover:border-brand-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-brand-50 text-brand-700 mb-4 group-hover:bg-brand-100 transition-colors">
            <IconChatBubble className="h-6 w-6" />
          </div>
          <h2 className="text-base font-semibold text-slate-900 mb-1">
            Mandar um aviso agora
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-3">
            Crie uma campanha pra avisar um grupo de proponentes — chega como notificação no portal e (opcional) e-mail.
          </p>
          <span className="text-sm font-medium text-brand-700 group-hover:text-brand-800 inline-flex items-center gap-1">
            Criar campanha
            <span aria-hidden>→</span>
          </span>
        </Link>

        <Link
          href="/admin/notificacoes/regras/nova"
          className="group rounded-xl border border-slate-200 bg-white p-5 hover:border-brand-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-amber-50 text-amber-700 mb-4 group-hover:bg-amber-100 transition-colors">
            <IconClock className="h-6 w-6" />
          </div>
          <h2 className="text-base font-semibold text-slate-900 mb-1">
            Programar aviso automático
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-3">
            Lembrete de rascunho, prazo vencendo, documento faltando — o sistema dispara sozinho quando o evento acontecer.
          </p>
          <span className="text-sm font-medium text-brand-700 group-hover:text-brand-800 inline-flex items-center gap-1">
            Criar regra
            <span aria-hidden>→</span>
          </span>
        </Link>

        <Link
          href="/admin/email-templates"
          className="group rounded-xl border border-slate-200 bg-white p-5 hover:border-brand-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-emerald-50 text-emerald-700 mb-4 group-hover:bg-emerald-100 transition-colors">
            <IconMail className="h-6 w-6" />
          </div>
          <h2 className="text-base font-semibold text-slate-900 mb-1">
            Editar texto dos e-mails
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-3">
            Boas-vindas, recuperação de senha, comprovante, recursos — personalize o conteúdo de cada e-mail do sistema.
          </p>
          <span className="text-sm font-medium text-brand-700 group-hover:text-brand-800 inline-flex items-center gap-1">
            Abrir templates
            <span aria-hidden>→</span>
          </span>
        </Link>
      </div>

      {/* Atividade recente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Últimas campanhas */}
        <Card padding="sm" className="sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-slate-900">Últimas campanhas</h3>
            <Link href="/admin/notificacoes/campanhas" className="text-xs font-medium text-brand-600 hover:text-brand-700">
              Ver todas
            </Link>
          </div>
          {recentCampanhas.length === 0 ? (
            <p className="text-sm text-slate-500 italic py-6 text-center">
              Você ainda não criou nenhuma campanha.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 -mx-2">
              {recentCampanhas.map((c) => {
                const status = STATUS_LABELS[c.status] ?? { label: c.status, variant: 'neutral' as const }
                const when = c.sentAt ?? c.createdAt
                return (
                  <li key={c.id}>
                    <Link
                      href={`/admin/notificacoes/campanhas/${c.id}`}
                      className="flex items-center justify-between gap-3 px-2 py-3 hover:bg-slate-50 rounded-md transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 truncate">{c.titulo}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {c.status === 'ENVIADA' ? 'Enviada' : c.status === 'RASCUNHO' ? 'Rascunho criado' : 'Atualizada'} {formatRelative(when)}
                          {c.totalAlvo > 0 && (
                            <span> · {c.totalEnviado}/{c.totalAlvo} destinatários</span>
                          )}
                        </p>
                      </div>
                      <Badge variant={status.variant} className="shrink-0">{status.label}</Badge>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        {/* Regras automáticas */}
        <Card padding="sm" className="sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Regras automáticas ativas</h3>
            </div>
            <Link href="/admin/notificacoes/regras" className="text-xs font-medium text-brand-600 hover:text-brand-700">
              Configurar
            </Link>
          </div>
          {activeRules.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-slate-500 italic mb-3">
                Nenhuma regra automática rodando no momento.
              </p>
              <Link
                href="/admin/notificacoes/regras/nova"
                className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800"
              >
                Criar a primeira →
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 -mx-2">
              {activeRules.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/admin/notificacoes/regras/${r.id}`}
                    className="flex items-center justify-between gap-3 px-2 py-3 hover:bg-slate-50 rounded-md transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">{r.nome}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Última atualização {formatRelative(r.updatedAt)}
                      </p>
                    </div>
                    <Badge variant="success" className="shrink-0">Ativa</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Footer com contagem 24h */}
      <div className="mt-5 sm:mt-6 flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-slate-50 border border-slate-200">
        <p className="text-sm text-slate-600">
          {ultimas24h === 0 ? (
            <>Nenhuma notificação foi entregue nas últimas 24 horas.</>
          ) : (
            <>
              <strong className="text-slate-900">{ultimas24h}</strong> notificaç{ultimas24h === 1 ? 'ão entregue' : 'ões entregues'} nas últimas 24 horas.
            </>
          )}
        </p>
        <Link href="/admin/notificacoes/historico" className="text-sm font-medium text-brand-600 hover:text-brand-700 shrink-0">
          Histórico completo →
        </Link>
      </div>
    </section>
  )
}
