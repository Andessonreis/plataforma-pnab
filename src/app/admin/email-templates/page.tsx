import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@server/lib/auth'
import { prisma } from '@server/lib/db'
import { TEMPLATE_META } from '@/lib/mail/placeholders'
import type { EmailTemplate } from '@/lib/mail/templates'
import { Badge, Card, FadeIn, IconMail } from '@client/components/ui'

export const metadata: Metadata = {
  title: 'Templates de E-mail — Portal PNAB Irecê',
}

export default async function AdminEmailTemplatesPage() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/')

  const overrides = await prisma.emailTemplateOverride.findMany({
    include: { updatedBy: { select: { nome: true } } },
  })
  const byKey = new Map(overrides.map((o) => [o.key, o]))

  const items = (Object.keys(TEMPLATE_META) as EmailTemplate[]).map((key) => ({
    key,
    meta: TEMPLATE_META[key],
    override: byKey.get(key) ?? null,
  }))

  const totalEditados = overrides.length
  const totalAtivos = overrides.filter((o) => o.enabled).length

  return (
    <section>
      <FadeIn>
        <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Textos dos e-mails</h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1">
              {items.length} e-mails do sistema · {totalAtivos} {totalAtivos === 1 ? 'com texto personalizado' : 'com textos personalizados'}
            </p>
          </div>
        </div>
      </FadeIn>

      <Card className="mb-4 sm:mb-6 bg-blue-50 border-blue-200">
        <div className="flex gap-3 items-start">
          <IconMail className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Como funciona</p>
            <p className="text-blue-800 leading-relaxed">
              Cada e-mail do sistema (boas-vindas, comprovante, recuperação de senha, etc.) tem um texto padrão.
              Você pode <strong>personalizar</strong> assunto e corpo de qualquer um, e quando ativar a personalização
              ela passa a ser usada em todos os envios. Os <code className="bg-blue-100 px-1 rounded">{'{{atalhos}}'}</code>
              listados em cada e-mail são preenchidos <strong>automaticamente pelo sistema</strong> com os dados de
              cada destinatário — você só precisa colocá-los no texto onde quiser que apareçam.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {items.map(({ key, meta, override }) => {
          const status = !override
            ? 'default'
            : override.enabled
              ? 'override-on'
              : 'override-off'

          return (
            <Link
              key={key}
              href={`/admin/email-templates/${key}`}
              className="block group"
            >
              <Card className="h-full transition-all hover:border-brand-300 hover:shadow-md">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-sm sm:text-base font-semibold text-slate-900 truncate">
                        {meta.label}
                      </h2>
                      {meta.sensitive && (
                        <Badge variant="warning" className="shrink-0">Sensível</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{meta.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                  {status === 'default' && (
                    <Badge variant="neutral">Texto padrão</Badge>
                  )}
                  {status === 'override-on' && (
                    <Badge variant="success">Personalização ativa</Badge>
                  )}
                  {status === 'override-off' && (
                    <Badge variant="neutral">Personalização inativa</Badge>
                  )}
                  {override && (
                    <span className="text-[11px] text-slate-500 ml-auto">
                      Editado por {override.updatedBy?.nome ?? '—'}
                    </span>
                  )}
                </div>

                <div className="mt-3 text-xs text-slate-600 flex items-center gap-1.5 group-hover:text-brand-600">
                  Abrir editor
                  <span aria-hidden>→</span>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
