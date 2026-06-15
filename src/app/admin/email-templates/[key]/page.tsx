import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@server/lib/auth'
import { prisma } from '@server/lib/db'
import { TEMPLATE_META } from '@shared/mail/placeholders'
import type { EmailTemplate } from '@shared/mail/templates'
import { FadeIn } from '@client/components/ui'
import { TemplateEditor } from './template-editor'

interface Props {
  params: Promise<{ key: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { key } = await params
  const meta = TEMPLATE_META[key as EmailTemplate]
  return {
    title: meta ? `${meta.label} — Templates de E-mail` : 'Templates de E-mail',
  }
}

export default async function AdminEmailTemplateEditPage({ params }: Props) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/')

  const { key } = await params
  const meta = TEMPLATE_META[key as EmailTemplate]
  if (!meta) notFound()

  const override = await prisma.emailTemplateOverride.findUnique({
    where: { key },
    include: { updatedBy: { select: { nome: true, email: true } } },
  })

  return (
    <section>
      <FadeIn>
        <div className="mb-4 sm:mb-6">
          <nav className="text-xs text-slate-500 mb-2">
            <Link href="/admin/email-templates" className="hover:text-brand-600">
              Templates de E-mail
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-slate-700">{meta.label}</span>
          </nav>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{meta.label}</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">{meta.description}</p>
        </div>
      </FadeIn>

      <TemplateEditor
        templateKey={key as EmailTemplate}
        meta={{
          label: meta.label,
          sensitive: meta.sensitive ?? false,
          placeholders: meta.placeholders,
        }}
        initial={
          override
            ? {
                subject: override.subject,
                body: override.body,
                enabled: override.enabled,
                updatedAt: override.updatedAt.toISOString(),
                updatedByName: override.updatedBy?.nome ?? null,
              }
            : null
        }
      />
    </section>
  )
}
