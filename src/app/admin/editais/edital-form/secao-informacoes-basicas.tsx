'use client'

import { Input, Textarea, Select, CurrencyInput } from '@/components/ui'
import type { EditalStatus } from '@prisma/client'
import { PdfOficialField } from '../pdf-oficial-field'
import { useEditalForm } from './edital-form-context'
import { TogglePillGroup } from './toggle-pill-group'
import { TIPO_PROPONENTE_OPTIONS, STATUS_OPTIONS, ANO_OPTIONS } from './constants'

export function SecaoInformacoesBasicas({ editalId }: { editalId?: string }) {
  const {
    titulo, setTitulo,
    resumo, setResumo,
    ano, setAno,
    valorTotal, setValorTotal,
    status, setStatus,
    vagasContemplados, setVagasContemplados,
    vagasSuplentes, setVagasSuplentes,
    tiposProponentePermitidos, setTiposProponentePermitidos,
  } = useEditalForm()

  function toggleTipoProponente(value: string) {
    setTiposProponentePermitidos((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value],
    )
  }

  return (
    <div className="grid gap-4 sm:gap-5">
      <Input
        label="Título do Edital"
        required
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Ex.: Edital de Fomento à Cultura Popular 2025"
      />
      <Textarea
        label="Resumo / Descrição"
        required
        rows={4}
        value={resumo}
        onChange={(e) => setResumo(e.target.value)}
        placeholder="Descreva brevemente o objeto e objetivos deste edital"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
        <Select label="Ano" required value={ano} options={ANO_OPTIONS} onChange={(e) => setAno(e.target.value)} />
        <CurrencyInput
          label="Valor Total (R$)"
          required
          value={valorTotal}
          onChange={(raw) => setValorTotal(raw)}
          hint="Ex: R$ 50.000,00"
        />
      </div>
      <Select
        label="Status"
        required
        value={status}
        options={STATUS_OPTIONS}
        onChange={(e) => setStatus(e.target.value as EditalStatus)}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
        <Input
          label="Vagas Contemplados"
          type="number"
          min={1}
          value={vagasContemplados}
          onChange={(e) => setVagasContemplados(e.target.value)}
          placeholder="Ilimitado"
        />
        <Input
          label="Vagas Suplentes"
          type="number"
          min={0}
          value={vagasSuplentes}
          onChange={(e) => setVagasSuplentes(e.target.value)}
          placeholder="Ilimitado"
        />
      </div>

      <div className="mt-6 pt-6 border-t border-slate-200">
        <label className="block text-sm font-medium text-slate-700 mb-2">Tipos de Proponente Aceitos</label>
        <p className="text-xs text-slate-500 mb-3">
          Selecione quais tipos de proponente podem se inscrever neste edital. Se nenhum for selecionado, todos os
          tipos serão aceitos.
        </p>
        <TogglePillGroup
          options={TIPO_PROPONENTE_OPTIONS}
          selected={tiposProponentePermitidos}
          onToggle={toggleTipoProponente}
          ariaLabel="Tipos de proponente aceitos"
        />
        {tiposProponentePermitidos.length > 0 && (
          <p className="text-xs text-brand-600 mt-2">
            Apenas{' '}
            {tiposProponentePermitidos
              .map((t) => TIPO_PROPONENTE_OPTIONS.find((o) => o.value === t)?.label || t)
              .join(', ')}{' '}
            poderão se inscrever.
          </p>
        )}
      </div>
      <PdfOficialField editalId={editalId} />
    </div>
  )
}
