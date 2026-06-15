import { IconChevronDown } from '@client/components/ui/icons'

interface FaqItemData {
  id: string
  pergunta: string
  resposta: string
  ordem: number
}

export function FaqAccordion({ items }: { items: FaqItemData[] }) {
  return (
    <div className="divide-y divide-slate-200">
      {items.map((item) => (
        <details key={item.id} className="group">
          <summary className="flex items-center justify-between gap-4 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            <span className="text-sm font-medium text-slate-900 group-open:text-brand-700 transition-colors">
              {item.pergunta}
            </span>
            <IconChevronDown className="h-5 w-5 text-slate-400 shrink-0 transition-transform group-open:rotate-180" />
          </summary>
          <div className="pb-4 text-sm text-slate-600 leading-relaxed pl-0">
            {item.resposta}
          </div>
        </details>
      ))}
    </div>
  )
}
