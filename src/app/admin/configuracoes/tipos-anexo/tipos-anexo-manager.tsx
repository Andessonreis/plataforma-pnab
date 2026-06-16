'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Input, Badge } from '@client/components/ui'

interface TipoAnexo {
  id: string
  tipo: string
  label: string
  obrigatorio: boolean
  tag: string
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

interface Props {
  initialTipos: TipoAnexo[]
  initialTags: string[]
}

export function TiposAnexoManager({ initialTipos, initialTags }: Props) {
  const router = useRouter()
  const [tipos, setTipos] = useState<TipoAnexo[]>(initialTipos)
  const [tags, setTags] = useState<string[]>(initialTags)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingTipo, setEditingTipo] = useState<TipoAnexo | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Estado do formulário do modal
  const [formLabel, setFormLabel] = useState('')
  const [formTag, setFormTag] = useState('')
  const [formObrigatorio, setFormObrigatorio] = useState(false)
  const [error, setError] = useState('')

  const filteredTipos = activeTag
    ? tipos.filter(t => t.tag === activeTag)
    : tipos

  // Agrupar por tag para exibição
  const grouped = filteredTipos.reduce<Record<string, TipoAnexo[]>>((acc, t) => {
    if (!acc[t.tag]) acc[t.tag] = []
    acc[t.tag].push(t)
    return acc
  }, {})

  function openCreate() {
    setEditingTipo(null)
    setFormLabel('')
    setFormTag('')
    setFormObrigatorio(false)
    setError('')
    setShowModal(true)
  }

  function openEdit(tipo: TipoAnexo) {
    setEditingTipo(tipo)
    setFormLabel(tipo.label)
    setFormTag(tipo.tag)
    setFormObrigatorio(tipo.obrigatorio)
    setError('')
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditingTipo(null)
    setError('')
  }

  async function refreshList() {
    try {
      const res = await fetch('/api/v1/configuracoes/tipos-anexo')
      if (res.ok) {
        const json = await res.json()
        setTipos(json.data.tipos)
        setTags(json.data.tags)
      }
    } catch {
      // silencioso
    }
  }

  async function handleSave() {
    setError('')

    if (!formLabel.trim()) {
      setError('Nome visível (label) é obrigatório.')
      return
    }
    if (!formTag.trim()) {
      setError('Tag/grupo é obrigatória.')
      return
    }

    setLoading(true)

    try {
      const payload = {
        label: formLabel.trim(),
        tag: formTag.trim(),
        obrigatorio: formObrigatorio,
      }

      if (editingTipo) {
        const res = await fetch(`/api/v1/configuracoes/tipos-anexo/tipo/${editingTipo.id}`, {
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
        const res = await fetch('/api/v1/configuracoes/tipos-anexo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
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
      const res = await fetch(`/api/v1/configuracoes/tipos-anexo/tipo/${id}`, {
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

  return (
    <div className="space-y-4">
      {/* Ações e filtro por tag */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTag(null)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              activeTag === null
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({tipos.length})
          </button>
          {tags.map(tag => {
            const count = tipos.filter(t => t.tag === tag).length
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                  activeTag === tag
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tag} ({count})
              </button>
            )
          })}
        </div>
        <Button onClick={openCreate}>
          + Novo Tipo
        </Button>
      </div>

      {/* Erro global */}
      {error && !showModal && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Tabela agrupada por tag */}
      {filteredTipos.length === 0 ? (
        <Card padding="sm" className="sm:p-6 text-center">
          <p className="text-sm text-slate-500 py-8">
            {activeTag
              ? `Nenhum tipo de anexo com a tag "${activeTag}".`
              : 'Nenhum tipo de anexo cadastrado. Crie o primeiro para usar nos editais.'}
          </p>
        </Card>
      ) : (
        Object.entries(grouped).map(([tag, tagTipos]) => (
          <div key={tag}>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{tag}</h3>
              <span className="text-xs text-slate-400">({tagTipos.length})</span>
            </div>
            <Card padding="sm" className="sm:p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left px-4 py-2.5 font-medium text-slate-500">ID (tipo)</th>
                      <th className="text-left px-4 py-2.5 font-medium text-slate-500">Label</th>
                      <th className="text-center px-4 py-2.5 font-medium text-slate-500">Obrigatório</th>
                      <th className="text-center px-4 py-2.5 font-medium text-slate-500">Sistema</th>
                      <th className="text-right px-4 py-2.5 font-medium text-slate-500">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tagTipos.map((tipo) => (
                      <tr key={tipo.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 font-mono text-xs text-slate-700">{tipo.tipo}</td>
                        <td className="px-4 py-2.5 text-slate-900">{tipo.label}</td>
                        <td className="px-4 py-2.5 text-center">
                          {tipo.obrigatorio ? (
                            <Badge variant="error">Sim</Badge>
                          ) : (
                            <span className="text-slate-400">Não</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {tipo.isSystem && <Badge variant="info">Sistema</Badge>}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="outline" size="sm" onClick={() => openEdit(tipo)}>
                              Editar
                            </Button>
                            {!tipo.isSystem && (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => setDeleteConfirm(tipo.id)}
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
              {tagTipos.some(t => deleteConfirm === t.id) && (
                <div className="mx-4 mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800 mb-2">
                    Excluir tipo &quot;{tagTipos.find(t => t.id === deleteConfirm)?.label}&quot;? Esta ação não pode ser desfeita.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(deleteConfirm!)}
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
          </div>
        ))
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
            aria-label={editingTipo ? 'Editar tipo de anexo' : 'Novo tipo de anexo'}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 rounded-t-xl z-10">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingTipo ? 'Editar Tipo de Anexo' : 'Novo Tipo de Anexo'}
              </h2>
            </div>

            <div className="px-6 py-4 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              {editingTipo?.isSystem && (
                <p className="text-xs text-amber-600">
                  Tipo do sistema — tag não pode ser alterada.
                </p>
              )}

              <Input
                label="Nome visível (label)"
                required
                value={formLabel}
                onChange={e => setFormLabel(e.target.value)}
                placeholder="Ex: Certificado PNCV"
              />

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">
                  Tag / Grupo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  list="tags-datalist"
                  value={formTag}
                  onChange={e => setFormTag(e.target.value)}
                  placeholder="Ex: PNAB, Cultura Viva"
                  disabled={editingTipo?.isSystem}
                  className={`block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 ${
                    editingTipo?.isSystem ? 'bg-slate-100 opacity-60 cursor-not-allowed' : 'bg-white'
                  }`}
                />
                <datalist id="tags-datalist">
                  {tags.map(tag => (
                    <option key={tag} value={tag} />
                  ))}
                </datalist>
                <p className="text-xs text-slate-400 mt-1">
                  Escolha uma tag existente ou digite uma nova.
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formObrigatorio}
                  onChange={e => setFormObrigatorio(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-slate-700">Obrigatório</span>
              </label>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 rounded-b-xl flex justify-end gap-3">
              <Button variant="outline" onClick={closeModal} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading
                  ? 'Salvando...'
                  : editingTipo
                    ? 'Salvar alterações'
                    : 'Criar tipo'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
