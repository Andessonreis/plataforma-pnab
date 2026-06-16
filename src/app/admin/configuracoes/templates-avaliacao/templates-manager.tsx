'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card } from '@client/components/ui'
import type { CriterioAvaliacao } from '@shared/avaliacao-criterios'
import type { Template, Props } from './templates-manager/types'
import { EMPTY_CRITERIO, parseCriterios } from './templates-manager/helpers'
import { TemplateList } from './templates-manager/TemplateList'
import { TemplateForm } from './templates-manager/TemplateForm'

export function TemplatesManager({ initialTemplates }: Props) {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>(initialTemplates)
  const [showModal, setShowModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Formulário
  const [formNome, setFormNome] = useState('')
  const [formDescricao, setFormDescricao] = useState('')
  const [formFormula, setFormFormula] = useState('')
  const [formCriterios, setFormCriterios] = useState<CriterioAvaliacao[]>([{ ...EMPTY_CRITERIO }])
  const [error, setError] = useState('')

  function openCreate() {
    setEditingTemplate(null)
    setFormNome('')
    setFormDescricao('')
    setFormFormula('((B1+B2)/2)+B3')
    setFormCriterios([{ ...EMPTY_CRITERIO }])
    setError('')
    setShowModal(true)
  }

  function openEdit(t: Template) {
    setEditingTemplate(t)
    setFormNome(t.nome)
    setFormDescricao(t.descricao ?? '')
    setFormFormula(t.formula ?? '')
    setFormCriterios(parseCriterios(t.criterios))
    setError('')
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditingTemplate(null)
    setError('')
  }

  async function refreshList() {
    try {
      const res = await fetch('/api/admin/configuracoes/templates-avaliacao?all=true')
      if (res.ok) {
        const json = await res.json()
        setTemplates(json.data)
      }
    } catch { /* silencioso */ }
  }

  // Gerenciar critérios
  function addCriterio() {
    const last = formCriterios[formCriterios.length - 1]
    setFormCriterios([...formCriterios, {
      ...EMPTY_CRITERIO,
      bloco: last?.bloco ?? '',
      modo: last?.modo ?? 'discreto',
    }])
  }

  function removeCriterio(index: number) {
    setFormCriterios(formCriterios.filter((_, i) => i !== index))
  }

  function updateCriterio(index: number, field: string, value: unknown) {
    const updated = [...formCriterios]
    updated[index] = { ...updated[index], [field]: value }
    // Sincronizar notaMax com plenamente em modo discreto
    if (field === 'plenamente' && updated[index].modo === 'discreto') {
      updated[index].notaMax = value as number
    }
    setFormCriterios(updated)
  }

  async function handleSave() {
    setError('')
    if (!formNome.trim()) { setError('Nome é obrigatório.'); return }
    if (formCriterios.length === 0) { setError('Adicione pelo menos um critério.'); return }

    const invalidCriterio = formCriterios.find(c => !c.criterio.trim())
    if (invalidCriterio) { setError('Todos os critérios precisam ter nome.'); return }

    setLoading(true)

    try {
      const payload = {
        nome: formNome.trim(),
        descricao: formDescricao.trim() || undefined,
        criterios: formCriterios,
        formula: formFormula.trim() || undefined,
      }

      if (editingTemplate) {
        const body: Record<string, unknown> = { ...payload }
        if (editingTemplate.isSystem) delete body.nome

        const res = await fetch(`/api/admin/configuracoes/templates-avaliacao/${editingTemplate.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const data = await res.json()
          setError(data.message || 'Erro ao atualizar.')
          return
        }
      } else {
        const res = await fetch('/api/admin/configuracoes/templates-avaliacao', {
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
      const res = await fetch(`/api/admin/configuracoes/templates-avaliacao/${id}`, { method: 'DELETE' })
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

  async function handleToggleAtivo(t: Template) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/configuracoes/templates-avaliacao/${t.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !t.ativo }),
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {templates.length} template(s) cadastrado(s)
        </p>
        <Button onClick={openCreate}>+ Novo Template</Button>
      </div>

      {error && !showModal && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {templates.length === 0 ? (
        <Card padding="sm" className="sm:p-6 text-center">
          <p className="text-sm text-slate-500 py-8">
            Nenhum template cadastrado. Crie o primeiro para agilizar a configuração dos editais.
          </p>
        </Card>
      ) : (
        <TemplateList
          templates={templates}
          loading={loading}
          deleteConfirm={deleteConfirm}
          onToggleAtivo={handleToggleAtivo}
          onEdit={openEdit}
          onRequestDelete={setDeleteConfirm}
          onConfirmDelete={handleDelete}
          onCancelDelete={() => setDeleteConfirm(null)}
        />
      )}

      {/* Modal de criação/edição */}
      {showModal && (
        <TemplateForm
          editingTemplate={editingTemplate}
          error={error}
          loading={loading}
          formNome={formNome}
          setFormNome={setFormNome}
          formFormula={formFormula}
          setFormFormula={setFormFormula}
          formDescricao={formDescricao}
          setFormDescricao={setFormDescricao}
          formCriterios={formCriterios}
          onAddCriterio={addCriterio}
          onRemoveCriterio={removeCriterio}
          onUpdateCriterio={updateCriterio}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}
    </div>
  )
}
