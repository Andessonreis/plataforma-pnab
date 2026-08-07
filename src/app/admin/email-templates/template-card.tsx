import Link from 'next/link'
import { Badge, Card } from '@/components/ui'
import type { TemplateMeta } from '@/lib/mail/placeholders'
import type { EmailTemplate } from '@/lib/mail/templates'

interface TemplateCardProps {
  templateKey: EmailTemplate
  meta: TemplateMeta
  status: 'default' | 'override-on' | 'override-off'
  updatedByName?: string | null
  recentlyWired?: boolean
}

export function TemplateCard({ templateKey, meta, status, updatedByName, recentlyWired }: TemplateCardProps) {
  return (
    <Link href={`/admin/email-templates/${templateKey}`} className="block group">
      <Card className="h-full transition-all hover:border-brand-300 hover:shadow-md">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="text-sm sm:text-base font-semibold text-slate-900 truncate">{meta.label}</h2>
              {meta.sensitive && <Badge variant="warning" className="shrink-0">Sensível</Badge>}
              {recentlyWired && <Badge variant="info" className="shrink-0">Recém-ativado</Badge>}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{meta.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
          {status === 'default' && <Badge variant="neutral">Texto padrão</Badge>}
          {status === 'override-on' && <Badge variant="success">Personalização ativa</Badge>}
          {status === 'override-off' && <Badge variant="neutral">Personalização inativa</Badge>}
          {updatedByName && (
            <span className="text-[11px] text-slate-500 ml-auto">Editado por {updatedByName}</span>
          )}
        </div>

        <div className="mt-3 text-xs text-slate-600 flex items-center gap-1.5 group-hover:text-brand-600">
          Abrir editor
          <span aria-hidden>→</span>
        </div>
      </Card>
    </Link>
  )
}
