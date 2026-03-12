'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Select } from '@/components/ui/select'

interface TipoDocumento {
  id: string
  valor: string
  label: string
  escopo: 'EDITAL' | 'INSCRICAO'
  ativo: boolean
  ordem: number
}

interface Props {
  initialData: TipoDocumento[]
}

const ESCOPO_LABELS = {
  EDITAL: 'Edital',
  INSCRICAO: 'Inscrição',
} as const

export function TiposDocumentoManager({ initialData }: Props) {
  const router = useRouter()
  const [tipos, setTipos] = useState(initialData)
  const [novoValor, setNovoValor] = useState('')
  const [novoLabel, setNovoLabel] = useState('')
  const [novoEscopo, setNovoEscopo] = useState<'EDITAL' | 'INSCRICAO'>('EDITAL')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [filtroEscopo, setFiltroEscopo] = useState<'' | 'EDITAL' | 'INSCRICAO'>('')
  const filtered = filtroEscopo ? tipos.filter(t => t.escopo === filtroEscopo) : tipos

  async function handleCreate() {
    if (!novoValor.trim() || !novoLabel.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/tipos-documento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valor: novoValor.trim().toUpperCase().replace(/\s+/g, '_'),
          label: novoLabel.trim(),
          escopo: novoEscopo,
          ordem: tipos.filter(t => t.escopo === novoEscopo).length,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setTipos(prev => [...prev, data])
      setNovoValor('')
      setNovoLabel('')
      router.refresh()
    } catch {
      setError('Erro ao criar tipo.')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdate(id: string) {
    if (!editLabel.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/tipos-documento/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: editLabel.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setTipos(prev => prev.map(t => t.id === id ? data : t))
      setEditingId(null)
      router.refresh()
    } catch {
      setError('Erro ao atualizar tipo.')
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleAtivo(tipo: TipoDocumento) {
    setError(null)
    try {
      const res = await fetch(`/api/admin/tipos-documento/${tipo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !tipo.ativo }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setTipos(prev => prev.map(t => t.id === tipo.id ? data : t))
      router.refresh()
    } catch {
      setError('Erro ao alterar status.')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover este tipo? Documentos existentes não serão afetados.')) return
    setError(null)
    try {
      const res = await fetch(`/api/admin/tipos-documento/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error)
        return
      }
      setTipos(prev => prev.filter(t => t.id !== id))
      router.refresh()
    } catch {
      setError('Erro ao remover tipo.')
    }
  }

  return (
    <div className="space-y-4">
      {/* Formulário de criação */}
      <Card className="p-4 space-y-3">
        <div className="flex gap-2">
          <Input
            label="Valor (código)"
            placeholder="Ex: ORCAMENTO"
            value={novoValor}
            onChange={(e) => setNovoValor(e.target.value)}
            className="flex-1"
            disabled={loading}
          />
          <Input
            label="Label (exibição)"
            placeholder="Ex: Orçamento"
            value={novoLabel}
            onChange={(e) => setNovoLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            className="flex-1"
            disabled={loading}
          />
        </div>
        <div className="flex gap-2 items-end">
          <Select
            label="Escopo"
            value={novoEscopo}
            onChange={(e) => setNovoEscopo(e.target.value as 'EDITAL' | 'INSCRICAO')}
            options={[
              { value: 'EDITAL', label: 'Edital (arquivos do admin)' },
              { value: 'INSCRICAO', label: 'Inscrição (anexos do proponente)' },
            ]}
          />
          <Button onClick={handleCreate} disabled={loading || !novoValor.trim() || !novoLabel.trim()}>
            Adicionar
          </Button>
        </div>
      </Card>

      {error && (
        <p className="text-sm text-red-600 font-medium">{error}</p>
      )}

      {/* Filtro */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={filtroEscopo === '' ? 'primary' : 'ghost'}
          onClick={() => setFiltroEscopo('')}
        >
          Todos ({tipos.length})
        </Button>
        <Button
          size="sm"
          variant={filtroEscopo === 'EDITAL' ? 'primary' : 'ghost'}
          onClick={() => setFiltroEscopo('EDITAL')}
        >
          Edital ({tipos.filter(t => t.escopo === 'EDITAL').length})
        </Button>
        <Button
          size="sm"
          variant={filtroEscopo === 'INSCRICAO' ? 'primary' : 'ghost'}
          onClick={() => setFiltroEscopo('INSCRICAO')}
        >
          Inscrição ({tipos.filter(t => t.escopo === 'INSCRICAO').length})
        </Button>
      </div>

      {/* Lista */}
      <Card className="divide-y divide-slate-100">
        {filtered.length === 0 && (
          <p className="p-6 text-center text-slate-500">
            Nenhum tipo cadastrado.
          </p>
        )}
        {filtered.map((tipo) => (
          <div key={tipo.id} className="flex items-center gap-3 px-4 py-3">
            {editingId === tipo.id ? (
              <>
                <Input
                  label="Editar label"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUpdate(tipo.id)
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  className="flex-1"
                  autoFocus
                />
                <Button size="sm" onClick={() => handleUpdate(tipo.id)} disabled={loading}>
                  Salvar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                  Cancelar
                </Button>
              </>
            ) : (
              <>
                <code className="text-xs text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                  {tipo.valor}
                </code>
                <span className={`flex-1 font-medium ${tipo.ativo ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                  {tipo.label}
                </span>
                <Badge variant={tipo.escopo === 'EDITAL' ? 'info' : 'warning'}>
                  {ESCOPO_LABELS[tipo.escopo]}
                </Badge>
                <Badge variant={tipo.ativo ? 'success' : 'neutral'}>
                  {tipo.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setEditingId(tipo.id); setEditLabel(tipo.label) }}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleAtivo(tipo)}
                  >
                    {tipo.ativo ? 'Desativar' : 'Ativar'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(tipo.id)}
                  >
                    Remover
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}
      </Card>
    </div>
  )
}
