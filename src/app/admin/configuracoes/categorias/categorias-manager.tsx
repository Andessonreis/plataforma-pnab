'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Input, Badge } from '@/components/ui'
import type { Category } from '@/lib/constants/categories'

interface Props {
  initialCategorias: Category[]
}

export function CategoriasManager({ initialCategorias }: Props) {
  const router = useRouter()
  const [categorias, setCategorias] = useState<Category[]>(initialCategorias)
  const [showModal, setShowModal] = useState(false)
  const [editingCat, setEditingCat] = useState<Category | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Estado do formulário
  const [formNome, setFormNome] = useState('')
  const [formDescricao, setFormDescricao] = useState('')
  const [error, setError] = useState('')

  function openCreate() {
    setEditingCat(null)
    setFormNome('')
    setFormDescricao('')
    setError('')
    setShowModal(true)
  }

  function openEdit(cat: Category) {
    setEditingCat(cat)
    setFormNome(cat.nome)
    setFormDescricao(cat.descricao ?? '')
    setError('')
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditingCat(null)
    setError('')
  }

  async function refreshList() {
    try {
      const res = await fetch('/api/admin/configuracoes/categorias?all=true')
      if (res.ok) {
        const json = await res.json()
        setCategorias(json.data)
      }
    } catch {
      // silencioso
    }
  }

  async function handleSave() {
    setError('')

    if (!formNome.trim()) {
      setError('Nome é obrigatório.')
      return
    }

    setLoading(true)

    try {
      if (editingCat) {
        const payload: Record<string, unknown> = {
          descricao: formDescricao.trim(),
        }
        if (!editingCat.isSystem) {
          payload.nome = formNome.trim()
        }

        const res = await fetch(`/api/admin/configuracoes/categorias/${editingCat.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const data = await res.json()
          setError(data.message || 'Erro ao atualizar.')
          return
        }
      } else {
        const res = await fetch('/api/admin/configuracoes/categorias', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: formNome.trim(),
            descricao: formDescricao.trim() || undefined,
          }),
        })
        if (!res.ok) {
          const data = await res.json()
          setError(data.message || 'Erro ao criar.')
          return
        }
      }

      closeModal()
      router.refresh()
      await refreshList()
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/configuracoes/categorias/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.message || 'Erro ao excluir.')
        return
      }
      setDeleteConfirm(null)
      router.refresh()
      await refreshList()
    } catch {
      setError('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleAtiva(cat: Category) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/configuracoes/categorias/${cat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativa: !cat.ativa }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.message || 'Erro ao alterar status.')
        return
      }
      router.refresh()
      await refreshList()
    } catch {
      setError('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  async function handleMove(index: number, direction: 'up' | 'down') {
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= categorias.length) return

    const newList = [...categorias]
    const tempOrdem = newList[index].ordem
    newList[index] = { ...newList[index], ordem: newList[swapIndex].ordem }
    newList[swapIndex] = { ...newList[swapIndex], ordem: tempOrdem }

    // Swap na lista visual
    ;[newList[index], newList[swapIndex]] = [newList[swapIndex], newList[index]]
    setCategorias(newList)

    // Persistir reordenação
    try {
      await fetch('/api/admin/configuracoes/categorias/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: newList.map((c, i) => ({ id: c.id, ordem: (i + 1) * 10 })),
        }),
      })
    } catch {
      // Reverter em caso de erro
      await refreshList()
    }
  }

  return (
    <div className="space-y-4">
      {/* Ações */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {categorias.length} categoria(s) cadastrada(s)
        </p>
        <Button onClick={openCreate}>
          + Nova Categoria
        </Button>
      </div>

      {/* Erro global */}
      {error && !showModal && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Tabela */}
      {categorias.length === 0 ? (
        <Card padding="sm" className="sm:p-6 text-center">
          <p className="text-sm text-slate-500 py-8">
            Nenhuma categoria cadastrada. Crie a primeira para usar nos editais.
          </p>
        </Card>
      ) : (
        <Card padding="sm" className="sm:p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-center px-3 py-2.5 font-medium text-slate-500 w-20">Ordem</th>
                  <th className="text-left px-4 py-2.5 font-medium text-slate-500">Nome</th>
                  <th className="text-left px-4 py-2.5 font-medium text-slate-500 hidden md:table-cell">Descrição</th>
                  <th className="text-center px-4 py-2.5 font-medium text-slate-500">Status</th>
                  <th className="text-center px-4 py-2.5 font-medium text-slate-500">Sistema</th>
                  <th className="text-right px-4 py-2.5 font-medium text-slate-500">Ações</th>
                </tr>
              </thead>
              <tbody>
                {categorias.map((cat, index) => (
                  <tr key={cat.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleMove(index, 'up')}
                          disabled={index === 0}
                          className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Mover para cima"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMove(index, 'down')}
                          disabled={index === categorias.length - 1}
                          className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Mover para baixo"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-900 font-medium">{cat.nome}</td>
                    <td className="px-4 py-2.5 text-slate-500 hidden md:table-cell">
                      {cat.descricao ? (
                        <span className="line-clamp-1">{cat.descricao}</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {cat.ativa ? (
                        <Badge variant="success">Ativa</Badge>
                      ) : (
                        <Badge variant="neutral">Inativa</Badge>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {cat.isSystem && <Badge variant="info">Sistema</Badge>}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleAtiva(cat)}
                          disabled={loading}
                        >
                          {cat.ativa ? 'Desativar' : 'Ativar'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEdit(cat)}>
                          Editar
                        </Button>
                        {!cat.isSystem && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setDeleteConfirm(cat.id)}
                          >
                            Excluir
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Confirmação de exclusão inline */}
          {deleteConfirm && (
            <div className="mx-4 mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 mb-2">
                Excluir categoria &quot;{categorias.find(c => c.id === deleteConfirm)?.nome}&quot;? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={loading}
                >
                  {loading ? 'Excluindo...' : 'Confirmar exclusão'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteConfirm(null)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Modal de criação/edição */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeModal}
            aria-hidden="true"
          />

          <div
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label={editingCat ? 'Editar categoria' : 'Nova categoria'}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 rounded-t-xl z-10">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingCat ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>
            </div>

            <div className="px-6 py-4 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              {editingCat?.isSystem && (
                <p className="text-xs text-amber-600">
                  Categoria do sistema — o nome não pode ser alterado.
                </p>
              )}

              <Input
                label="Nome da categoria"
                required
                value={formNome}
                onChange={e => setFormNome(e.target.value)}
                placeholder="Ex: Artes Cênicas"
                disabled={editingCat?.isSystem}
              />

              <div>
                <label htmlFor="cat-descricao" className="text-sm font-medium text-slate-700 block mb-1.5">
                  Descrição <span className="text-slate-400">(opcional)</span>
                </label>
                <textarea
                  id="cat-descricao"
                  value={formDescricao}
                  onChange={e => setFormDescricao(e.target.value)}
                  placeholder="Breve descrição desta categoria..."
                  rows={3}
                  maxLength={500}
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 bg-white"
                />
                <p className="text-xs text-slate-400 mt-1">
                  {formDescricao.length}/500 caracteres
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 rounded-b-xl flex justify-end gap-3">
              <Button variant="outline" onClick={closeModal} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading
                  ? 'Salvando...'
                  : editingCat
                    ? 'Salvar alterações'
                    : 'Criar categoria'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
