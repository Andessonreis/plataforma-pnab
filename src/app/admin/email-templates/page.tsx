import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { TEMPLATE_META } from '@/lib/mail/placeholders'
import type { EmailTemplate } from '@/lib/mail/templates'
import { Card, FadeIn, StaggerContainer, StaggerItem, StatCard, IconMail, IconCheck, IconClock } from '@/components/ui'
import { TemplateCard } from './template-card'

export const metadata: Metadata = {
  title: 'Templates de E-mail — Portal PNAB Irecê',
}

// Ligados numa mesma passada (recurso submetido/decidido, protocolo de
// atendimento, lembrete de prazo) — antes cadastrados na tela mas nunca
// disparados por nenhum fluxo real. Só pra dar contexto visual ao admin
// de que esses passaram a funcionar de verdade.
const RECENTLY_WIRED = new Set<EmailTemplate>([
  'recurso_submetido',
  'recurso_decidido',
  'protocolo_atendimento',
  'notificacao_prazo',
  'atendimento_respondido',
])

const CATEGORIAS: { titulo: string; chaves: EmailTemplate[] }[] = [
  {
    titulo: 'Proponente',
    chaves: ['boas_vindas', 'comprovante_inscricao', 'habilitacao', 'resultado_preliminar', 'resultado_final', 'recurso_decidido', 'notificacao_prazo', 'protocolo_atendimento', 'atendimento_respondido'],
  },
  {
    titulo: 'Equipe / interno',
    chaves: ['equipe_habilitacao_pendente', 'recurso_submetido'],
  },
  {
    titulo: 'Segurança',
    chaves: ['recuperacao_senha'],
  },
  {
    titulo: 'Campanhas',
    chaves: ['notificacao_generica'],
  },
]

export default async function AdminEmailTemplatesPage() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/')

  const overrides = await prisma.emailTemplateOverride.findMany({
    include: { updatedBy: { select: { nome: true } } },
  })
  const byKey = new Map(overrides.map((o) => [o.key, o]))

  const totalAtivos = overrides.filter((o) => o.enabled).length
  const totalTemplates = Object.keys(TEMPLATE_META).length

  return (
    <section>
      <FadeIn>
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Textos dos e-mails</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1">
            Personalize o assunto e o corpo de qualquer e-mail que o sistema envia automaticamente.
          </p>
        </div>
      </FadeIn>

      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <StaggerItem>
          <StatCard
            label="Templates"
            value={totalTemplates}
            sub="e-mails do sistema"
            color="bg-blue-50"
            iconColor="text-blue-600"
            icon={<IconMail className="h-6 w-6" />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Personalizados"
            value={totalAtivos}
            sub="com texto próprio ativo"
            color="bg-green-50"
            iconColor="text-green-600"
            icon={<IconCheck className="h-6 w-6" />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Recém-ativados"
            value={RECENTLY_WIRED.size}
            sub="agora disparam de verdade"
            color="bg-amber-50"
            iconColor="text-amber-600"
            icon={<IconClock className="h-6 w-6" />}
          />
        </StaggerItem>
      </StaggerContainer>

      <Card className="mb-4 sm:mb-6 bg-blue-50 border-blue-200">
        <div className="flex gap-3 items-start">
          <IconMail className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Como funciona</p>
            <p className="text-blue-800 leading-relaxed">
              Cada e-mail do sistema tem um texto padrão. Você pode <strong>personalizar</strong> assunto e
              corpo de qualquer um, e quando ativar a personalização ela passa a ser usada em todos os envios.
              Os <code className="bg-blue-100 px-1 rounded">{'{{atalhos}}'}</code> listados em cada e-mail são
              preenchidos <strong>automaticamente pelo sistema</strong> com os dados de cada destinatário.
            </p>
          </div>
        </div>
      </Card>

      <div className="space-y-6 sm:space-y-8">
        {CATEGORIAS.map((cat) => (
          <div key={cat.titulo}>
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">{cat.titulo}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {cat.chaves.map((key) => {
                const override = byKey.get(key) ?? null
                const status = !override ? 'default' : override.enabled ? 'override-on' : 'override-off'
                return (
                  <TemplateCard
                    key={key}
                    templateKey={key}
                    meta={TEMPLATE_META[key]}
                    status={status}
                    updatedByName={override?.updatedBy?.nome}
                    recentlyWired={RECENTLY_WIRED.has(key)}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
