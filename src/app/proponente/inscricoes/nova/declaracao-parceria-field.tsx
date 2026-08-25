'use client'

import { useState } from 'react'
import { Input, Button, Aviso } from '@/components/ui'
import { formatCpfCnpj, formatTelefoneBR } from '@/lib/utils/format'
import { isValidCpf, isValidCnpj } from '@/lib/validators/document'
import {
  DECLARACAO_PARCERIA_TEMPLATE_KEY,
  DECLARACAO_PARCERIA_LIMITES,
} from '@/lib/pdf/templates/declaracao-parceria'
import type { DeclaracaoParceria } from '@/types/declaracao-parceria'

interface DeclaracaoParceriaFieldProps {
  editalId: string
  value: DeclaracaoParceria
  onChange: (value: DeclaracaoParceria) => void
}

/**
 * Aparece em qualquer edital que tenha um anexo "Anexo 01 — Declaração de
 * Parceria" cadastrado (ver ANEXO_01_TITULO). Em vez do proponente preencher
 * à mão o texto corrido com colchetes, ele preenche campos normais aqui e a
 * plataforma gera o PDF oficial já preenchido — sem alterar nenhuma palavra
 * do documento da Secretaria. O modelo em branco continua disponível acima
 * pra quem preferir preencher à mão.
 */
export function DeclaracaoParceriaField({ editalId, value, onChange }: DeclaracaoParceriaFieldProps) {
  const [gerando, setGerando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const cpfInvalido = value.mestreCpf.length > 0 && !isValidCpf(value.mestreCpf)
  const cnpjInvalido = value.parceriaCnpj.length > 0 && !isValidCnpj(value.parceriaCnpj)

  const camposObrigatoriosFaltando =
    !value.mestreNome.trim() ||
    !isValidCpf(value.mestreCpf) ||
    value.mestreTelefone.trim().length < 8 ||
    !value.parceriaNome.trim() ||
    !isValidCnpj(value.parceriaCnpj) ||
    !value.parceriaEndereco.trim() ||
    value.parceriaTelefone.trim().length < 8

  function update(patch: Partial<DeclaracaoParceria>) {
    onChange({ ...value, ...patch })
  }

  async function handleGerar() {
    setErro(null)
    setGerando(true)
    try {
      const res = await fetch('/api/proponente/documentos-gerados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateKey: DECLARACAO_PARCERIA_TEMPLATE_KEY, editalId, dados: value }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message ?? `Erro ${res.status} ao gerar o documento.`)
      }

      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = 'anexo-01-declaracao-parceria-preenchido.pdf'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(blobUrl)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao gerar o documento. Tente novamente.')
    } finally {
      setGerando(false)
    }
  }

  return (
    <div id="tour-nova-declaracao-parceria" className="mb-6 rounded-lg border border-slate-200 p-4">
      <h3 className="text-base font-semibold text-slate-900">Preencher o Anexo 01 (Declaração de Parceria) aqui</h3>
      <p className="text-sm text-slate-600 mt-1 mb-4">
        Em vez de preencher o modelo à mão, preencha os campos abaixo e a plataforma gera o PDF do Anexo 01 já
        pronto — só falta você assinar e enviar.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="Nome da(o) Mestra(e)"
          value={value.mestreNome}
          onChange={(e) => update({ mestreNome: e.target.value })}
          placeholder="Nome completo"
          maxLength={DECLARACAO_PARCERIA_LIMITES.mestreNome}
          autoComplete="off"
        />
        <Input
          label="CPF da(o) Mestra(e)"
          value={value.mestreCpf}
          onChange={(e) => update({ mestreCpf: formatCpfCnpj(e.target.value) })}
          placeholder="000.000.000-00"
          inputMode="numeric"
          maxLength={14}
          autoComplete="off"
          error={cpfInvalido ? 'CPF inválido — confira os números.' : undefined}
        />
        <Input
          label="Telefone da(o) Mestra(e)"
          value={value.mestreTelefone}
          onChange={(e) => update({ mestreTelefone: formatTelefoneBR(e.target.value) })}
          placeholder="(00) 00000-0000"
          inputMode="tel"
          maxLength={15}
          autoComplete="off"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <Input
          label="Nome da entidade parceira"
          value={value.parceriaNome}
          onChange={(e) => update({ parceriaNome: e.target.value })}
          placeholder="Ex.: Associação Cultural..."
          maxLength={DECLARACAO_PARCERIA_LIMITES.parceriaNome}
          autoComplete="off"
        />
        <Input
          label="CNPJ da entidade parceira"
          value={value.parceriaCnpj}
          onChange={(e) => update({ parceriaCnpj: formatCpfCnpj(e.target.value) })}
          placeholder="00.000.000/0001-00"
          inputMode="numeric"
          maxLength={18}
          autoComplete="off"
          error={cnpjInvalido ? 'CNPJ inválido — confira os números.' : undefined}
        />
        <Input
          label="Endereço da entidade parceira"
          value={value.parceriaEndereco}
          onChange={(e) => update({ parceriaEndereco: e.target.value })}
          placeholder="Rua, número, bairro"
          maxLength={DECLARACAO_PARCERIA_LIMITES.parceriaEndereco}
          autoComplete="off"
        />
        <Input
          label="Telefone da entidade parceira"
          value={value.parceriaTelefone}
          onChange={(e) => update({ parceriaTelefone: formatTelefoneBR(e.target.value) })}
          placeholder="(00) 00000-0000"
          inputMode="tel"
          maxLength={15}
          autoComplete="off"
        />
      </div>

      <p className="text-xs text-slate-500 mt-3">
        Espaço do documento é limitado — se o nome ou endereço não couber, use o modelo em branco acima e
        preencha à mão.
      </p>

      <div className="mt-4">
        <Aviso tom="atencao">
          <strong>Este documento só é válido assinado.</strong> Depois de gerar, baixe o PDF, assine à mão ou
          digitalmente (ex.: gov.br) e envie o arquivo assinado no envio de anexos abaixo. Sem assinatura, a
          Secretaria não pode aceitar o documento.
        </Aviso>
      </div>

      {erro && (
        <p className="text-sm text-red-700 mt-3" role="alert">
          {erro}
        </p>
      )}

      <Button
        type="button"
        variant="outline"
        className="mt-4"
        onClick={handleGerar}
        loading={gerando}
        disabled={camposObrigatoriosFaltando}
      >
        Gerar PDF preenchido
      </Button>
    </div>
  )
}
