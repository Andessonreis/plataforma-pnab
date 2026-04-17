'use client'

import { Button, Input, Select, Textarea, CurrencyInput } from '@/components/ui'
import type { SelectOption } from '@/components/ui'
import type { CampoFormulario } from '@/types/campo-formulario'

type LinhaValor = Record<string, unknown>

// ─── Bloco informativo ──────────────────────────────────────────────────────

export function BlocoInfo({ campo }: { campo: CampoFormulario }) {
  const variante = campo.variante ?? 'info'
  const paleta =
    variante === 'alerta'
      ? 'border-red-200 bg-red-50 text-red-900'
      : variante === 'atencao'
        ? 'border-amber-200 bg-amber-50 text-amber-900'
        : 'border-slate-200 bg-slate-50 text-slate-800'

  return (
    <div className={`rounded-md border ${paleta} p-4 text-sm`}>
      {campo.label && (
        <p className="font-semibold mb-2">{campo.label}</p>
      )}
      <div className="whitespace-pre-line leading-relaxed">{campo.conteudo ?? ''}</div>
    </div>
  )
}

// ─── Subcampo simples (reutilizado por tabela e grupo) ──────────────────────

function SubCampoInput({
  campo,
  value,
  onChange,
}: {
  campo: CampoFormulario
  value: unknown
  onChange: (v: unknown) => void
}) {
  const str = (value as string) ?? ''

  switch (campo.tipo) {
    case 'textarea':
      return (
        <Textarea
          label={campo.label}
          value={str}
          onChange={(e) => onChange(e.target.value)}
          placeholder={campo.placeholder}
          required={campo.obrigatorio}
          hint={campo.hint}
        />
      )
    case 'select':
      return (
        <Select
          label={campo.label}
          value={str}
          onChange={(e) => onChange(e.target.value)}
          options={(campo.opcoes || []).map((op): SelectOption => ({ value: op, label: op }))}
          placeholder="Selecione..."
          required={campo.obrigatorio}
          hint={campo.hint}
        />
      )
    case 'moeda':
    case 'currency':
      return (
        <CurrencyInput
          label={campo.label}
          value={str}
          onChange={(raw) => onChange(raw)}
          placeholder={campo.placeholder}
          required={campo.obrigatorio}
          hint={campo.hint}
        />
      )
    case 'data':
    case 'date':
      return (
        <Input
          label={campo.label}
          type="date"
          value={str}
          onChange={(e) => onChange(e.target.value)}
          required={campo.obrigatorio}
          hint={campo.hint}
        />
      )
    case 'numero':
    case 'number':
      return (
        <Input
          label={campo.label}
          type="number"
          value={str}
          onChange={(e) => onChange(e.target.value)}
          placeholder={campo.placeholder}
          required={campo.obrigatorio}
          hint={campo.hint}
        />
      )
    default:
      return (
        <Input
          label={campo.label}
          value={str}
          onChange={(e) => onChange(e.target.value)}
          placeholder={campo.placeholder}
          required={campo.obrigatorio}
          hint={campo.hint}
        />
      )
  }
}

// ─── Tabela com linhas adicionáveis ─────────────────────────────────────────

export function TabelaInput({
  campo,
  value,
  onChange,
}: {
  campo: CampoFormulario
  value: LinhaValor[]
  onChange: (v: LinhaValor[]) => void
}) {
  const linhas = Array.isArray(value) ? value : []
  const colunas = campo.colunas ?? []
  const linhaMin = campo.linhaMin ?? 0
  const linhaMax = campo.linhaMax ?? Infinity

  const addLinha = () => {
    if (linhas.length >= linhaMax) return
    const nova: LinhaValor = {}
    for (const col of colunas) nova[col.nome] = ''
    onChange([...linhas, nova])
  }

  const removeLinha = (i: number) => {
    if (linhas.length <= linhaMin) return
    onChange(linhas.filter((_, idx) => idx !== i))
  }

  const updateCell = (i: number, nome: string, v: unknown) => {
    const next = linhas.slice()
    next[i] = { ...next[i], [nome]: v }
    onChange(next)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-slate-700">
          {campo.label}
          {campo.obrigatorio && <span className="text-red-500 ml-1">*</span>}
        </label>
        <Button type="button" variant="ghost" size="sm" onClick={addLinha}>
          + Adicionar linha
        </Button>
      </div>
      {campo.hint && <p className="text-xs text-slate-500 mb-2">{campo.hint}</p>}

      {linhas.length === 0 ? (
        <p className="text-sm text-slate-400 italic border border-dashed border-slate-200 rounded-md p-4 text-center">
          Nenhuma linha. Clique em &ldquo;Adicionar linha&rdquo; para começar.
        </p>
      ) : (
        <div className="space-y-3">
          {linhas.map((linha, i) => (
            <div key={i} className="rounded-md border border-slate-200 bg-slate-50/50 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500">Linha {i + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLinha(i)}
                  disabled={linhas.length <= linhaMin}
                >
                  Remover
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {colunas.map((col) => (
                  <SubCampoInput
                    key={col.nome}
                    campo={col}
                    value={linha[col.nome]}
                    onChange={(v) => updateCell(i, col.nome, v)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Grupo repetível (cards verticais) ──────────────────────────────────────

export function GrupoRepetivelInput({
  campo,
  value,
  onChange,
}: {
  campo: CampoFormulario
  value: LinhaValor[]
  onChange: (v: LinhaValor[]) => void
}) {
  const itens = Array.isArray(value) ? value : []
  const subcampos = campo.subcampos ?? []
  const itemMin = campo.itemMin ?? 0
  const itemMax = campo.itemMax ?? Infinity
  const labelItem = campo.labelItem ?? 'Item'

  const addItem = () => {
    if (itens.length >= itemMax) return
    const novo: LinhaValor = {}
    for (const sub of subcampos) novo[sub.nome] = ''
    onChange([...itens, novo])
  }

  const removeItem = (i: number) => {
    if (itens.length <= itemMin) return
    onChange(itens.filter((_, idx) => idx !== i))
  }

  const updateField = (i: number, nome: string, v: unknown) => {
    const next = itens.slice()
    next[i] = { ...next[i], [nome]: v }
    onChange(next)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-slate-700">
          {campo.label}
          {campo.obrigatorio && <span className="text-red-500 ml-1">*</span>}
        </label>
        <Button type="button" variant="ghost" size="sm" onClick={addItem}>
          + Adicionar {labelItem}
        </Button>
      </div>
      {campo.hint && <p className="text-xs text-slate-500 mb-2">{campo.hint}</p>}

      {itens.length === 0 ? (
        <p className="text-sm text-slate-400 italic border border-dashed border-slate-200 rounded-md p-4 text-center">
          Nenhum item. Clique em &ldquo;Adicionar {labelItem}&rdquo; para começar.
        </p>
      ) : (
        <div className="space-y-4">
          {itens.map((item, i) => (
            <div key={i} className="rounded-md border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <span className="text-sm font-semibold text-slate-700">
                  {labelItem} {i + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(i)}
                  disabled={itens.length <= itemMin}
                >
                  Remover
                </Button>
              </div>
              <div className="space-y-3">
                {subcampos.map((sub) => (
                  <SubCampoInput
                    key={sub.nome}
                    campo={sub}
                    value={item[sub.nome]}
                    onChange={(v) => updateField(i, sub.nome, v)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Modo leitura (revisão / admin detail) ─────────────────────────────────

export function CampoEstruturaRevisao({
  campo,
  value,
}: {
  campo: CampoFormulario
  value: unknown
}) {
  if (campo.tipo === 'info') {
    return <BlocoInfo campo={campo} />
  }

  const linhas = Array.isArray(value) ? (value as LinhaValor[]) : []

  if (campo.tipo === 'tabela') {
    const colunas = campo.colunas ?? []
    return (
      <div>
        <p className="text-sm font-medium text-slate-700 mb-2">
          {campo.label}
          {campo.obrigatorio && <span className="text-red-500 ml-1">*</span>}
        </p>
        {linhas.length === 0 ? (
          <p className="text-sm text-red-500 italic">Nenhuma linha preenchida</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  {colunas.map((col) => (
                    <th key={col.nome} className="text-left font-medium text-slate-600 px-3 py-2 border border-slate-200">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {linhas.map((linha, i) => (
                  <tr key={i}>
                    {colunas.map((col) => {
                      const v = linha[col.nome]
                      const str = v === undefined || v === null || v === ''
                        ? '—'
                        : Array.isArray(v) ? v.join(', ') : String(v)
                      return (
                        <td key={col.nome} className="px-3 py-2 border border-slate-200 text-slate-800 align-top whitespace-pre-wrap break-words">
                          {str}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  if (campo.tipo === 'grupo_repetivel') {
    const subcampos = campo.subcampos ?? []
    const labelItem = campo.labelItem ?? 'Item'
    return (
      <div>
        <p className="text-sm font-medium text-slate-700 mb-2">
          {campo.label}
          {campo.obrigatorio && <span className="text-red-500 ml-1">*</span>}
        </p>
        {linhas.length === 0 ? (
          <p className="text-sm text-red-500 italic">Nenhum item preenchido</p>
        ) : (
          <div className="space-y-3">
            {linhas.map((item, i) => (
              <div key={i} className="rounded border border-slate-200 p-3 bg-slate-50">
                <p className="text-xs font-medium text-slate-500 mb-2">
                  {labelItem} {i + 1}
                </p>
                <dl className="space-y-2">
                  {subcampos.map((sub) => {
                    const v = item[sub.nome]
                    const empty = v === undefined || v === null || v === ''
                    return (
                      <div key={sub.nome}>
                        <dt className="text-xs text-slate-500">{sub.label}</dt>
                        <dd className={`text-sm ${empty ? 'text-red-500 italic' : 'text-slate-900'} whitespace-pre-wrap break-words`}>
                          {empty ? 'Não preenchido' : Array.isArray(v) ? v.join(', ') : String(v)}
                        </dd>
                      </div>
                    )
                  })}
                </dl>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return null
}
