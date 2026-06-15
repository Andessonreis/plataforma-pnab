'use client'

import { Input, Card, Textarea, Select } from '@client/components/ui'
import type { EditalStatus } from '@prisma/client'
import { PdfOficialField } from '../../pdf-oficial-field'
import { TIPO_PROPONENTE_OPTIONS, STATUS_OPTIONS, ANO_OPTIONS } from '../constants'
import { formatarMoeda, normalizarMoedaOnBlur } from '../moeda'
import { SectionHeader } from '../SectionHeader'

export function SecaoInformacoesBasicas({
  collapsed,
  onToggle,
  titulo, setTitulo,
  resumo, setResumo,
  ano, setAno,
  valorTotal, setValorTotal,
  status, setStatus,
  vagasContemplados, setVagasContemplados,
  vagasSuplentes, setVagasSuplentes,
  tiposProponentePermitidos, setTiposProponentePermitidos,
  editalId,
}: {
  collapsed: boolean
  onToggle: () => void
  titulo: string
  setTitulo: (v: string) => void
  resumo: string
  setResumo: (v: string) => void
  ano: string
  setAno: (v: string) => void
  valorTotal: string
  setValorTotal: (v: string) => void
  status: EditalStatus
  setStatus: (v: EditalStatus) => void
  vagasContemplados: string
  setVagasContemplados: (v: string) => void
  vagasSuplentes: string
  setVagasSuplentes: (v: string) => void
  tiposProponentePermitidos: string[]
  setTiposProponentePermitidos: (updater: (prev: string[]) => string[]) => void
  editalId?: string
}) {
  return (
    <Card padding="sm" className="sm:p-6">
      <SectionHeader number={1} title="Informações Básicas" collapsed={collapsed} onToggle={onToggle} />
      {!collapsed && <div className="grid gap-4 sm:gap-5 mt-4 sm:mt-5">
        <Input
          label="Título do Edital"
          required
          value={titulo}
          onChange={e => setTitulo(e.target.value)}
          placeholder="Ex.: Edital de Fomento à Cultura Popular 2025"
        />
        <Textarea
          label="Resumo / Descrição"
          required
          rows={4}
          value={resumo}
          onChange={e => setResumo(e.target.value)}
          placeholder="Descreva brevemente o objeto e objetivos deste edital"
        />
        <div className="grid grid-cols-2 gap-3 sm:gap-5">
          <Select
            label="Ano"
            required
            value={ano}
            options={ANO_OPTIONS}
            onChange={e => setAno(e.target.value)}
          />
          <Input
            label="Valor Total (R$)"
            required
            type="text"
            inputMode="decimal"
            value={valorTotal}
            onChange={e => setValorTotal(formatarMoeda(e.target.value))}
            onBlur={e => setValorTotal(normalizarMoedaOnBlur(e.target.value))}
            placeholder="50.000,00"
            hint="Use vírgula para separar centavos. Ex: 50.000,00"
          />
        </div>
        <Select
          label="Status"
          required
          value={status}
          options={STATUS_OPTIONS}
          onChange={e => setStatus(e.target.value as EditalStatus)}
        />
        <div className="grid grid-cols-2 gap-3 sm:gap-5">
          <Input
            label="Vagas Contemplados"
            type="number"
            min={1}
            value={vagasContemplados}
            onChange={e => setVagasContemplados(e.target.value)}
            placeholder="Ilimitado"
          />
          <Input
            label="Vagas Suplentes"
            type="number"
            min={0}
            value={vagasSuplentes}
            onChange={e => setVagasSuplentes(e.target.value)}
            placeholder="Ilimitado"
          />
        </div>

        {/* Tipos de Proponente Permitidos */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Tipos de Proponente Aceitos
          </label>
          <p className="text-xs text-slate-500 mb-3">
            Selecione quais tipos de proponente podem se inscrever neste edital.
            Se nenhum for selecionado, todos os tipos serão aceitos.
          </p>
          <div className="flex flex-wrap gap-2">
            {TIPO_PROPONENTE_OPTIONS.map(opt => {
              const selected = tiposProponentePermitidos.includes(opt.value)
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setTiposProponentePermitidos(prev =>
                      selected
                        ? prev.filter(t => t !== opt.value)
                        : [...prev, opt.value]
                    )
                  }}
                  aria-pressed={selected}
                  className={[
                    'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                    'focus-visible:outline-2 focus-visible:outline-offset-2',
                    selected
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-brand-400',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
          {tiposProponentePermitidos.length > 0 && (
            <p className="text-xs text-brand-600 mt-2">
              Apenas {tiposProponentePermitidos.map(t => TIPO_PROPONENTE_OPTIONS.find(o => o.value === t)?.label || t).join(', ')} poderão se inscrever.
            </p>
          )}
        </div>
        <PdfOficialField editalId={editalId} />
      </div>}
    </Card>
  )
}
