'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

interface Categoria {
  id: string
  nome: string
  ativo: boolean
  ordem: number
}

interface Props {
  initialData: Categoria[]
}

export function CategoriasManager({ initialData }: Props) {
  const router = useRouter()
  const [categorias, setCategorias] = useState(initialData)
  const [novoNome, setNovoNome] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNome, setEditNome] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    if (!novoNome.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: novoNome.trim(), ordem: categorias.length }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setCategorias(prev => [...prev, data])
      setNovoNome('')
      router.refresh()
    } catch {
      setError('Erro ao criar categoria.')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdate(id: string) {
    if (!editNome.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/categorias/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: editNome.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setCategorias(prev => prev.map(c => c.id === id ? data : c))
      setEditingId(null)
      router.refresh()
    } catch {
      setError('Erro ao atualizar categoria.')
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleAtivo(cat: Categoria) {
    setError(null)
    try {
      const res = await fetch(`/api/admin/categorias/${cat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !cat.ativo }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setCategorias(prev => prev.map(c => c.id === cat.id ? data : c))
      router.refresh()
    } catch {
      setError('Erro ao alterar status.')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover esta categoria? Editais existentes não serão afetados.')) return
    setError(null)
    try {
      const res = await fetch(`/api/admin/categorias/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error)
        return
      }
      setCategorias(prev => prev.filter(c => c.id !== id))
      router.refresh()
    } catch {
      setError('Erro ao remover categoria.')
    }
  }

  return (
    <div className="space-y-4">
      {/* Formulário de criação */}
      <Card className="p-4">
        <div className="flex gap-2">
          <Input
            label="Nova categoria"
            placeholder="Nome da nova categoria..."
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            disabled={loading}
            className="flex-1"
          />
          <Button onClick={handleCreate} disabled={loading || !novoNome.trim()}>
            Adicionar
          </Button>
        </div>
      </Card>

      {error && (
        <p className="text-sm text-red-600 font-medium">{error}</p>
      )}

      {/* Lista de categorias */}
      <Card className="divide-y divide-slate-100">
        {categorias.length === 0 && (
          <p className="p-6 text-center text-slate-500">
            Nenhuma categoria cadastrada.
          </p>
        )}
        {categorias.map((cat) => (
          <div key={cat.id} className="flex items-center gap-3 px-4 py-3">
            {editingId === cat.id ? (
              <>
                <Input
                  label="Editar categoria"
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUpdate(cat.id)
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  className="flex-1"
                  autoFocus
                />
                <Button size="sm" onClick={() => handleUpdate(cat.id)} disabled={loading}>
                  Salvar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                  Cancelar
                </Button>
              </>
            ) : (
              <>
                <span className="text-sm text-slate-500 w-8 text-center">
                  {cat.ordem}
                </span>
                <span className={`flex-1 font-medium ${cat.ativo ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                  {cat.nome}
                </span>
                <Badge variant={cat.ativo ? 'success' : 'neutral'}>
                  {cat.ativo ? 'Ativa' : 'Inativa'}
                </Badge>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setEditingId(cat.id); setEditNome(cat.nome) }}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleAtivo(cat)}
                  >
                    {cat.ativo ? 'Desativar' : 'Ativar'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(cat.id)}
                  >
                    Remover
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}
      </Card>

      <p className="text-xs text-slate-500">
        {categorias.filter(c => c.ativo).length} ativa(s) de {categorias.length} total
      </p>
    </div>
  )
}
