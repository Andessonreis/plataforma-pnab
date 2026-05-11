'use client'

import { useEffect, useRef, useState } from 'react'

interface UserRecord {
  id: string
  nome: string
  email: string
  cpfCnpj: string | null
  tipoProponente: string | null
  role: string
}

interface UserPickerProps {
  selectedIds: string[]
  onChange: (ids: string[]) => void
  label?: string
  hint?: string
}

export function UserPicker({ selectedIds, onChange, label = 'Adicionar destinatários', hint }: UserPickerProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserRecord[]>([])
  const [selected, setSelected] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const missing = selectedIds.filter((id) => !selected.find((u) => u.id === id))
    if (missing.length === 0) return

    fetch(`/api/admin/users/search?ids=${encodeURIComponent(missing.join(','))}`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.data) && d.data.length > 0) {
          setSelected((prev) => {
            const map = new Map(prev.map((u) => [u.id, u]))
            for (const u of d.data) map.set(u.id, u)
            return Array.from(map.values())
          })
        }
      })
      .catch(() => {})
  }, [selectedIds, selected])

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    const timer = setTimeout(() => {
      fetch(`/api/admin/users/search?q=${encodeURIComponent(query.trim())}&role=PROPONENTE&limit=15`)
        .then((r) => r.json())
        .then((d) => setResults(Array.isArray(d.data) ? d.data : []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function addUser(u: UserRecord) {
    if (!selectedIds.includes(u.id)) {
      onChange([...selectedIds, u.id])
      setSelected((prev) => (prev.find((x) => x.id === u.id) ? prev : [...prev, u]))
    }
    setQuery('')
    setResults([])
    setOpen(false)
  }

  function removeUser(id: string) {
    onChange(selectedIds.filter((x) => x !== id))
    setSelected((prev) => prev.filter((u) => u.id !== id))
  }

  const inputId = 'user-picker-search'

  return (
    <div ref={containerRef}>
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
      </label>

      <div className="relative">
        <input
          id={inputId}
          type="text"
          autoComplete="off"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Digite nome, e-mail ou CPF/CNPJ (mín. 2 caracteres)"
          className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 min-h-[44px]"
        />

        {open && (query.trim().length >= 2) && (
          <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-72 overflow-y-auto">
            {loading && (
              <p className="px-3 py-2 text-xs text-slate-500">Buscando...</p>
            )}
            {!loading && results.length === 0 && (
              <p className="px-3 py-2 text-xs text-slate-500">Nenhum proponente encontrado.</p>
            )}
            {!loading && results.map((u) => {
              const already = selectedIds.includes(u.id)
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => addUser(u)}
                  disabled={already}
                  className={`w-full text-left px-3 py-2 border-b border-slate-50 last:border-b-0 ${
                    already ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {u.nome}
                    {already && <span className="ml-2 text-[10px] text-emerald-700">(já adicionado)</span>}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {u.email}{u.cpfCnpj ? ` · ${u.cpfCnpj}` : ''}
                  </p>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}

      {selected.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selected.map((u) => (
            <span
              key={u.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 text-brand-800 border border-brand-200 px-2.5 py-1 text-xs"
            >
              <span className="font-medium truncate max-w-[180px]">{u.nome}</span>
              <button
                type="button"
                onClick={() => removeUser(u.id)}
                aria-label={`Remover ${u.nome}`}
                className="text-brand-700 hover:text-brand-900 leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
