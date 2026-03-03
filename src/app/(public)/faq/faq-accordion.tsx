'use client'

import { useState, useId } from 'react'
import { Input } from '@/components/ui'

interface FaqItemData {
  id: string
  pergunta: string
  resposta: string
}

interface FaqAccordionProps {
  items: FaqItemData[]
  initialQuery?: string
}

function IconSearch({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  )
}

function IconChevron({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  )
}

export function FaqAccordion({ items, initialQuery = '' }: FaqAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [query, setQuery] = useState(initialQuery)
  const baseId = useId()

  const filtered = query.trim()
    ? items.filter(
        (item) =>
          item.pergunta.toLowerCase().includes(query.toLowerCase()) ||
          item.resposta.toLowerCase().includes(query.toLowerCase()),
      )
    : items

  function toggle(id: string) {
    setOpenId((prev) => (prev === id ? null : id))
  }

  return (
    <div>
      {/* Busca */}
      <div className="mb-8 max-w-xl mx-auto">
        <Input
          label="Buscar nas perguntas"
          placeholder="Digite sua dúvida..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          leftIcon={<IconSearch className="h-5 w-5" />}
        />
      </div>

      {/* Resultados */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">
            Nenhum resultado encontrado
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Tente buscar com outros termos ou entre em contato conosco.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const isOpen = openId === item.id
            const panelId = `${baseId}-panel-${item.id}`
            const headerId = `${baseId}-header-${item.id}`

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-lg overflow-hidden"
              >
                <h3>
                  <button
                    id={headerId}
                    type="button"
                    role="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggle(item.id)}
                    className="flex w-full items-center justify-between px-6 py-4 text-left text-base font-medium text-slate-900 hover:bg-slate-50 transition-colors min-h-[44px]"
                  >
                    <span className="pr-4">{item.pergunta}</span>
                    <IconChevron
                      className={[
                        'h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200',
                        isOpen ? 'rotate-180' : '',
                      ].join(' ')}
                    />
                  </button>
                </h3>

                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={headerId}
                  className={[
                    'transition-all duration-200 ease-in-out overflow-hidden',
                    isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0',
                  ].join(' ')}
                >
                  <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                    {item.resposta}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Contagem de resultados ao filtrar */}
      {query.trim() && filtered.length > 0 && (
        <p className="mt-4 text-center text-sm text-slate-500">
          {filtered.length} {filtered.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
        </p>
      )}
    </div>
  )
}
