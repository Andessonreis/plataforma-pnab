import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { TEMPLATE_META } from '@/lib/mail/placeholders'
import type { EmailTemplate } from '@/lib/mail/templates'
import { Badge, Card, FadeIn, IconMail } from '@/components/ui'

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
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Templates de E-mail</h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1">
              {items.length} templates · {totalEditados} com override · {totalAtivos} ativos
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
              Cada template tem uma versão padrão definida no código. Você pode criar um <strong>override</strong> com
              assunto e corpo personalizados. Quando o override está <strong>ativo</strong>, ele substitui o template padrão
              em todos os disparos. Use os <code className="bg-blue-100 px-1 rounded">{'{{placeholders}}'}</code> listados em cada template
              para inserir dados dinâmicos (nome do proponente, número da inscrição, link, etc.).
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
                    <Badge variant="neutral">Padrão (código)</Badge>
                  )}
                  {status === 'override-on' && (
                    <Badge variant="success">Override ativo</Badge>
                  )}
                  {status === 'override-off' && (
                    <Badge variant="neutral">Override desativado</Badge>
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
