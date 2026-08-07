'use client'

import type { RefObject } from 'react'
import { Card } from '@/components/ui'

interface EditorFieldsProps {
  subject: string
  onSubjectChange: (value: string) => void
  body: string
  onBodyChange: (value: string) => void
  bodyRef: RefObject<HTMLTextAreaElement | null>
}

export function EditorFields({ subject, onSubjectChange, body, onBodyChange, bodyRef }: EditorFieldsProps) {
  return (
    <div className="lg:col-span-3 space-y-3">
      <Card>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Assunto</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          maxLength={255}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
        <p className="mt-1 text-[11px] text-slate-500">{subject.length}/255 caracteres</p>
      </Card>

      <Card>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Corpo (HTML)</label>
        <textarea
          ref={bodyRef}
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          maxLength={50_000}
          rows={18}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          spellCheck={false}
        />
        <p className="mt-1 text-[11px] text-slate-500">
          Tags permitidas: p, br, strong, em, h1-h4, ul, ol, li, a, img, table, hr. Scripts e formulários
          são bloqueados na sanitização. {body.length}/50000
        </p>
      </Card>
    </div>
  )
}
