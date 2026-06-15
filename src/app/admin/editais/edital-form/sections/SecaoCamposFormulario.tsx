'use client'

import { Input, Button, Card, Select } from '@client/components/ui'
import { CHAR_LIMIT_DEFAULTS } from '@shared/campo-limits'
import type { CampoFormulario } from '@shared/types/campo-formulario'
import { SectionHeader } from '../SectionHeader'
import { TIPO_PROPONENTE_OPTIONS } from '../constants'

export function SecaoCamposFormulario({
  collapsed,
  onToggle,
  camposFormulario,
  addCampoFormulario,
  removeCampoFormulario,
  updateCampoFormulario,
}: {
  collapsed: boolean
  onToggle: () => void
  camposFormulario: CampoFormulario[]
  addCampoFormulario: () => void
  removeCampoFormulario: (index: number) => void
  updateCampoFormulario: (index: number, field: keyof CampoFormulario, value: unknown) => void
}) {
  return (
    <Card padding="sm" className="sm:p-6">
      <SectionHeader
        number={4}
        title="Campos do Formulário de Inscrição"
        collapsed={collapsed}
        onToggle={onToggle}
        actions={
          <Button type="button" variant="outline" size="sm" onClick={addCampoFormulario}>
            + Adicionar campo
          </Button>
        }
      >
        <p className="text-sm text-slate-500 mt-2">
          Configure os campos que o proponente deverá preencher ao se inscrever.
        </p>
      </SectionHeader>

      {!collapsed && (camposFormulario.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-4">
          Nenhum campo configurado. O formulário de inscrição ficará vazio.
        </p>
      ) : (
        <div className="space-y-4">
          {camposFormulario.map((campo, idx) => (
            <div key={idx} className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-medium text-slate-400">Campo {idx + 1}</span>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => removeCampoFormulario(idx)}
                  aria-label={`Remover campo ${idx + 1}`}
                >
                  Remover
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Label (exibido ao proponente)"
                  required
                  value={campo.label}
                  onChange={e => updateCampoFormulario(idx, 'label', e.target.value)}
                  placeholder="Ex.: Nome do Projeto"
                />
                <Select
                  label="Tipo do campo"
                  required
                  value={campo.tipo}
                  options={[
                    { value: 'texto', label: 'Texto curto' },
                    { value: 'textarea', label: 'Texto longo' },
                    { value: 'numero', label: 'Número' },
                    { value: 'data', label: 'Data' },
                    { value: 'select', label: 'Seleção (dropdown)' },
                    { value: 'multiselect', label: 'Seleção múltipla' },
                    { value: 'arquivo', label: 'Arquivo' },
                  ]}
                  onChange={e => {
                    updateCampoFormulario(idx, 'tipo', e.target.value)
                    // Limpar limites customizados ao trocar tipo
                    updateCampoFormulario(idx, 'minLength', null)
                    updateCampoFormulario(idx, 'maxLength', null)
                  }}
                />
              </div>

              {campo.tipo === 'arquivo' && (
                <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
                  Campos do tipo <strong>arquivo</strong> aparecem na etapa de <strong>Anexos</strong> da inscrição, não em &quot;Dados do Projeto&quot;. Para campos de preenchimento, use outro tipo.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Placeholder"
                  value={campo.placeholder}
                  onChange={e => updateCampoFormulario(idx, 'placeholder', e.target.value)}
                  placeholder="Texto de exemplo no campo"
                />
                <Input
                  label="Dica (hint)"
                  value={campo.hint}
                  onChange={e => updateCampoFormulario(idx, 'hint', e.target.value)}
                  placeholder="Texto de ajuda abaixo do campo"
                />
              </div>

              {(campo.tipo === 'select' || campo.tipo === 'multiselect') && (
                <Input
                  label="Opções (separadas por vírgula)"
                  value={(campo.opcoes ?? []).join(', ')}
                  onChange={e => updateCampoFormulario(idx, 'opcoes', e.target.value.split(',').map(o => o.trim()).filter(Boolean))}
                  placeholder="Opção 1, Opção 2, Opção 3"
                />
              )}

              {(['texto', 'textarea', 'numero'] as const).includes(campo.tipo as 'texto' | 'textarea' | 'numero') && (() => {
                const defaults = CHAR_LIMIT_DEFAULTS[campo.tipo]
                return (
                  <div className="rounded-md bg-slate-50 border border-slate-200 px-3 py-3 space-y-2">
                    <p className="text-xs font-medium text-slate-600">
                      Limite de caracteres
                      <span className="ml-1 font-normal text-slate-400">— deixe vazio para usar o padrão</span>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="Mínimo"
                        type="number"
                        min={0}
                        value={campo.minLength != null ? String(campo.minLength) : ''}
                        onChange={e => {
                          const v = e.target.value.trim()
                          updateCampoFormulario(idx, 'minLength', v === '' ? null : Number(v))
                        }}
                        placeholder={`Padrão: ${defaults?.minLength ?? 0}`}
                      />
                      <Input
                        label="Máximo"
                        type="number"
                        min={1}
                        value={campo.maxLength != null ? String(campo.maxLength) : ''}
                        onChange={e => {
                          const v = e.target.value.trim()
                          updateCampoFormulario(idx, 'maxLength', v === '' ? null : Number(v))
                        }}
                        placeholder={`Padrão: ${defaults?.maxLength ?? 200}`}
                      />
                    </div>
                  </div>
                )
              })()}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={campo.obrigatorio}
                  onChange={e => updateCampoFormulario(idx, 'obrigatorio', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-slate-700">Campo obrigatório</span>
              </label>

              {/* Visibilidade por tipo de proponente */}
              <div>
                <p className="text-xs font-medium text-slate-600 mb-1.5">
                  Visível para tipos de proponente
                  <span className="ml-1 font-normal text-slate-400">— vazio = todos</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {TIPO_PROPONENTE_OPTIONS.map(opt => {
                    const selected = campo.tiposProponente ?? []
                    const isActive = selected.includes(opt.value)
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          const current = campo.tiposProponente ?? []
                          const next = isActive
                            ? current.filter(t => t !== opt.value)
                            : [...current, opt.value]
                          updateCampoFormulario(idx, 'tiposProponente', next)
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          isActive
                            ? 'bg-brand-600 text-white border-brand-600'
                            : 'bg-white text-slate-600 border-slate-300 hover:border-brand-400 hover:text-brand-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </Card>
  )
}
