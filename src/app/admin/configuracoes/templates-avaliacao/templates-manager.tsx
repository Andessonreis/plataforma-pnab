'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Input, Badge } from '@client/components/ui'
import type { CriterioAvaliacao } from '@/lib/avaliacao-criterios'

interface Template {
  id: string
  nome: string
  descricao: string | null
  criterios: CriterioAvaliacao[] | unknown
  formula: string | null
  isSystem: boolean
  ativo: boolean
  ordem: number
  createdAt: string
  updatedAt: string
}

interface Props {
  initialTemplates: Template[]
}

const EMPTY_CRITERIO: CriterioAvaliacao = {
  criterio: '',
  peso: 1,
  notaMax: 10,
  bloco: '',
  modo: 'discreto',
  naoAtende: 0,
  parcial: 5,
  plenamente: 10,
}

function parseCriterios(raw: unknown): CriterioAvaliacao[] {
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) } catch { return [] }
  }
  return []
}

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

  // Resumo por bloco
  function getBlocoSummary(criterios: CriterioAvaliacao[]) {
    const blocos = new Map<string, number>()
    for (const c of criterios) {
      const bloco = c.bloco || 'Geral'
      const max = c.modo === 'discreto' ? (c.plenamente ?? c.notaMax) : c.notaMax
      blocos.set(bloco, (blocos.get(bloco) ?? 0) + max)
    }
    return Array.from(blocos.entries())
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
        <Card padding="sm" className="sm:p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-4 py-2.5 font-medium text-slate-500">Nome</th>
                  <th className="text-center px-4 py-2.5 font-medium text-slate-500">Critérios</th>
                  <th className="text-left px-4 py-2.5 font-medium text-slate-500 hidden md:table-cell">Fórmula</th>
                  <th className="text-center px-4 py-2.5 font-medium text-slate-500">Status</th>
                  <th className="text-center px-4 py-2.5 font-medium text-slate-500">Sistema</th>
                  <th className="text-right px-4 py-2.5 font-medium text-slate-500">Ações</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => {
                  const criterios = parseCriterios(t.criterios)
                  return (
                    <tr key={t.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-slate-900">{t.nome}</div>
                        {t.descricao && <div className="text-xs text-slate-400 line-clamp-1">{t.descricao}</div>}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <Badge variant="neutral">{criterios.length}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 hidden md:table-cell">
                        {t.formula ? (
                          <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">{t.formula}</code>
                        ) : (
                          <span className="text-slate-300">Média ponderada</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {t.ativo ? <Badge variant="success">Ativo</Badge> : <Badge variant="neutral">Inativo</Badge>}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {t.isSystem && <Badge variant="info">Sistema</Badge>}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="outline" size="sm" onClick={() => handleToggleAtivo(t)} disabled={loading}>
                            {t.ativo ? 'Desativar' : 'Ativar'}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openEdit(t)}>Editar</Button>
                          {!t.isSystem && (
                            <Button variant="danger" size="sm" onClick={() => setDeleteConfirm(t.id)}>Excluir</Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {deleteConfirm && (
            <div className="mx-4 mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 mb-2">
                Excluir template &quot;{templates.find(t => t.id === deleteConfirm)?.nome}&quot;? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-2">
                <Button variant="danger" size="sm" onClick={() => handleDelete(deleteConfirm)} disabled={loading}>
                  {loading ? 'Excluindo...' : 'Confirmar exclusão'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)} disabled={loading}>Cancelar</Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Modal de criação/edição */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} aria-hidden="true" />

          <div
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label={editingTemplate ? 'Editar template' : 'Novo template'}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 rounded-t-xl z-10">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingTemplate ? 'Editar Template' : 'Novo Template'}
              </h2>
            </div>

            <div className="px-6 py-4 space-y-5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
              )}

              {editingTemplate?.isSystem && (
                <p className="text-xs text-amber-600">Template do sistema — o nome não pode ser alterado.</p>
              )}

              {/* Dados básicos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nome do template"
                  required
                  value={formNome}
                  onChange={e => setFormNome(e.target.value)}
                  placeholder="Ex: PNAB Cultura Viva"
                  disabled={editingTemplate?.isSystem}
                />
                <Input
                  label="Fórmula de cálculo"
                  value={formFormula}
                  onChange={e => setFormFormula(e.target.value)}
                  placeholder="Ex: ((B1+B2)/2)+B3"
                />
              </div>

              <div>
                <label htmlFor="tpl-descricao" className="text-sm font-medium text-slate-700 block mb-1.5">
                  Descrição <span className="text-slate-400">(opcional)</span>
                </label>
                <textarea
                  id="tpl-descricao"
                  value={formDescricao}
                  onChange={e => setFormDescricao(e.target.value)}
                  placeholder="Breve descrição do template..."
                  rows={2}
                  maxLength={1000}
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 bg-white"
                />
              </div>

              {/* Resumo por bloco */}
              {formCriterios.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {getBlocoSummary(formCriterios).map(([bloco, maxPts]) => (
                    <span key={bloco} className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 text-xs font-medium px-2 py-1 rounded">
                      {bloco}: {maxPts} pts max
                    </span>
                  ))}
                  <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-xs font-medium px-2 py-1 rounded">
                    {formCriterios.length} critério(s)
                  </span>
                </div>
              )}

              {/* Editor de critérios */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-700">Critérios de Avaliação</h3>
                  <Button size="sm" onClick={addCriterio}>+ Critério</Button>
                </div>

                {formCriterios.map((c, i) => (
                  <div key={i} className="border border-slate-200 rounded-lg p-3 space-y-3 bg-slate-50/50">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-medium text-slate-400 mt-1">#{i + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeCriterio(i)}
                        className="text-red-400 hover:text-red-600 text-xs"
                        aria-label="Remover critério"
                      >
                        Remover
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input
                        label="Bloco"
                        value={c.bloco ?? ''}
                        onChange={e => updateCriterio(i, 'bloco', e.target.value)}
                        placeholder="Ex: Bloco 1"
                      />
                      <div className="md:col-span-2">
                        <Input
                          label="Nome do critério"
                          required
                          value={c.criterio}
                          onChange={e => updateCriterio(i, 'criterio', e.target.value)}
                          placeholder="Ex: Iniciativas Desenvolvidas"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-1.5">
                        Descrição <span className="text-slate-400">(opcional)</span>
                      </label>
                      <input
                        type="text"
                        value={c.descricao ?? ''}
                        onChange={e => updateCriterio(i, 'descricao', e.target.value)}
                        placeholder="Orientação para o avaliador..."
                        className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="text-sm font-medium text-slate-700 block mb-1.5">Modo</label>
                        <select
                          value={c.modo ?? 'slider'}
                          onChange={e => updateCriterio(i, 'modo', e.target.value)}
                          className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 bg-white"
                        >
                          <option value="slider">Slider (nota livre)</option>
                          <option value="discreto">Discreto (3 níveis)</option>
                        </select>
                      </div>

                      {c.modo === 'discreto' ? (
                        <>
                          <Input
                            label="Não Atende"
                            type="number"
                            value={c.naoAtende ?? 0}
                            onChange={e => updateCriterio(i, 'naoAtende', Number(e.target.value))}
                            min={0}
                          />
                          <Input
                            label="Parcial"
                            type="number"
                            value={c.parcial ?? 0}
                            onChange={e => updateCriterio(i, 'parcial', Number(e.target.value))}
                            min={0}
                          />
                          <Input
                            label="Plenamente"
                            type="number"
                            value={c.plenamente ?? 0}
                            onChange={e => updateCriterio(i, 'plenamente', Number(e.target.value))}
                            min={0}
                          />
                        </>
                      ) : (
                        <>
                          <Input
                            label="Nota Máxima"
                            type="number"
                            value={c.notaMax}
                            onChange={e => updateCriterio(i, 'notaMax', Number(e.target.value))}
                            min={0}
                            step={0.5}
                          />
                          <Input
                            label="Peso"
                            type="number"
                            value={c.peso}
                            onChange={e => updateCriterio(i, 'peso', Number(e.target.value))}
                            min={0}
                            step={0.5}
                          />
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 rounded-b-xl flex justify-end gap-3">
              <Button variant="outline" onClick={closeModal} disabled={loading}>Cancelar</Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? 'Salvando...' : editingTemplate ? 'Salvar alterações' : 'Criar template'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
