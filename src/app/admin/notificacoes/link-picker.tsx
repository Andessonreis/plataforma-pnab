'use client'

import { useState } from 'react'

export interface EditalWithSlug {
  id: string
  titulo: string
  slug: string
}

type LinkMode = 'NONE' | 'MY_INSCRICOES' | 'EDITAL' | 'CUSTOM'

interface LinkPickerProps {
  value: string
  onChange: (value: string) => void
  editais: EditalWithSlug[]
}

function parseInitial(value: string, editais: EditalWithSlug[]): { mode: LinkMode; editalId: string; custom: string } {
  if (!value || !value.trim()) return { mode: 'NONE', editalId: '', custom: '' }
  const v = value.trim()
  if (v === '/proponente/inscricoes' || v === '/proponente/inscricoes/') {
    return { mode: 'MY_INSCRICOES', editalId: '', custom: '' }
  }
  const match = v.match(/^\/editais\/([^/?#]+)/)
  if (match) {
    const slug = match[1]
    const found = editais.find((e) => e.slug === slug)
    return { mode: 'EDITAL', editalId: found ? found.id : '', custom: found ? '' : v }
  }
  return { mode: 'CUSTOM', editalId: '', custom: v }
}

export function LinkPicker({ value, onChange, editais }: LinkPickerProps) {
  const initial = parseInitial(value, editais)
  const [mode, setMode] = useState<LinkMode>(initial.mode)
  const [editalId, setEditalId] = useState<string>(initial.editalId)
  const [custom, setCustom] = useState<string>(initial.custom)

  function emit(nextMode: LinkMode, nextEdital: string, nextCustom: string) {
    if (nextMode === 'NONE') return onChange('')
    if (nextMode === 'MY_INSCRICOES') return onChange('/proponente/inscricoes')
    if (nextMode === 'EDITAL') {
      const found = editais.find((e) => e.id === nextEdital)
      return onChange(found ? `/editais/${found.slug}` : '')
    }
    return onChange(nextCustom.trim())
  }

  return (
    <fieldset className="space-y-3">
      <legend className="block text-sm font-medium text-slate-700 mb-1.5">
        Para onde o botão de ação leva?
      </legend>

      <div className="space-y-2">
        <Option
          checked={mode === 'NONE'}
          onSelect={() => {
            setMode('NONE')
            emit('NONE', editalId, custom)
          }}
          title="Sem link"
          description="A notificação aparece sem botão de ação."
        />
        <Option
          checked={mode === 'MY_INSCRICOES'}
          onSelect={() => {
            setMode('MY_INSCRICOES')
            emit('MY_INSCRICOES', editalId, custom)
          }}
          title="Minhas inscrições"
          description="Leva o destinatário para a lista das próprias inscrições no portal."
        />
        <Option
          checked={mode === 'EDITAL'}
          onSelect={() => {
            setMode('EDITAL')
            emit('EDITAL', editalId, custom)
          }}
          title="Página de um edital"
          description="Leva para a página pública do edital escolhido."
        >
          {mode === 'EDITAL' && (
            <select
              value={editalId}
              onChange={(e) => {
                setEditalId(e.target.value)
                emit('EDITAL', e.target.value, custom)
              }}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">— Escolher edital —</option>
              {editais.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.titulo}
                </option>
              ))}
            </select>
          )}
        </Option>
        <Option
          checked={mode === 'CUSTOM'}
          onSelect={() => {
            setMode('CUSTOM')
            emit('CUSTOM', editalId, custom)
          }}
          title="Outro link (avançado)"
          description="Use só se nenhum dos atalhos acima servir. Cole uma URL completa (https://...) ou um caminho interno (/algo)."
        >
          {mode === 'CUSTOM' && (
            <input
              type="text"
              value={custom}
              onChange={(e) => {
                setCustom(e.target.value)
                emit('CUSTOM', editalId, e.target.value)
              }}
              placeholder="https://... ou /caminho"
              className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          )}
        </Option>
      </div>
    </fieldset>
  )
}

interface OptionProps {
  checked: boolean
  onSelect: () => void
  title: string
  description: string
  children?: React.ReactNode
}

function Option({ checked, onSelect, title, description, children }: OptionProps) {
  return (
    <label
      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer border min-h-[60px] transition-colors ${
        checked ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:bg-slate-50'
      }`}
    >
      <input
        type="radio"
        checked={checked}
        onChange={onSelect}
        className="mt-1 h-4 w-4 text-brand-600 focus:ring-brand-500"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900">{title}</p>
        <p className="text-xs text-slate-600 mt-0.5">{description}</p>
        {children}
      </div>
    </label>
  )
}
