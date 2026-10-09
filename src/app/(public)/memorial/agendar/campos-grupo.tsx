'use client'

import { Input, Select } from '@/components/ui'
import { idDoCampo } from '@/components/formulario-dinamico/campo-com-erro'
import { TIPOS_VISITANTE } from '@/lib/memorial/agendamento/status'
import type { DadosVisita, ErrosVisita } from './dados-visita'

interface CamposProps {
  dados: DadosVisita
  erros: ErrosVisita
  aoMudar: (parcial: Partial<DadosVisita>) => void
}

const TIPOS = TIPOS_VISITANTE.map((t) => ({ value: t, label: t }))

/** Dados do grupo: quem é, quantos são e de onde vêm. */
export function CamposGrupo({ dados, erros, maxPessoas, aoMudar }: CamposProps & { maxPessoas: number }) {
  return (
    <fieldset className="mt-6 space-y-5">
      <legend className="mb-1 text-base font-semibold text-tinta-900">Grupo</legend>

      <Select
        id={idDoCampo('tipoVisitante')}
        label="Tipo de visitante"
        placeholder="Escolha uma opção"
        options={TIPOS}
        value={dados.tipoVisitante}
        onChange={(e) => aoMudar({ tipoVisitante: e.target.value })}
        error={erros.tipoVisitante}
        required
      />
      <Input
        id={idDoCampo('instituicao')}
        label="Instituição ou nome do grupo"
        hint="Nome da escola, associação, órgão ou família."
        value={dados.instituicao}
        onChange={(e) => aoMudar({ instituicao: e.target.value })}
        error={erros.instituicao}
        required
        autoComplete="organization"
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          id={idDoCampo('quantidade')}
          label="Quantidade de pessoas"
          hint={`Até ${maxPessoas}, contando os responsáveis.`}
          type="number"
          inputMode="numeric"
          min={1}
          max={maxPessoas}
          value={dados.quantidade}
          onChange={(e) => aoMudar({ quantidade: e.target.value })}
          error={erros.quantidade}
          required
        />
        <Input
          id={idDoCampo('faixaEtaria')}
          label="Faixa etária"
          placeholder="Ex.: 8 a 10 anos"
          value={dados.faixaEtaria}
          onChange={(e) => aoMudar({ faixaEtaria: e.target.value })}
          error={erros.faixaEtaria}
        />
      </div>
      <Input
        id={idDoCampo('turma')}
        label="Ano ou turma"
        hint="Para escolas. Ex.: 4º ano B."
        value={dados.turma}
        onChange={(e) => aoMudar({ turma: e.target.value })}
        error={erros.turma}
      />
      <div className="grid gap-5 sm:grid-cols-[2fr_1fr]">
        <Input
          id={idDoCampo('endereco')}
          label="Endereço"
          value={dados.endereco}
          onChange={(e) => aoMudar({ endereco: e.target.value })}
          error={erros.endereco}
          autoComplete="street-address"
        />
        <Input
          id={idDoCampo('cidade')}
          label="Cidade"
          value={dados.cidade}
          onChange={(e) => aoMudar({ cidade: e.target.value })}
          error={erros.cidade}
          autoComplete="address-level2"
        />
      </div>
    </fieldset>
  )
}

export type { CamposProps }
