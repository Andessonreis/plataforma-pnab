'use client'

import { CampoGrupoFields } from '@/app/admin/editais/campo-grupo-fields'
import { CampoInfoFields } from '@/app/admin/editais/campo-info-fields'
import { CampoSimplesFields } from '@/app/admin/editais/campo-simples-fields'
import { CampoTabelaFields } from '@/app/admin/editais/campo-tabela-fields'
import type { CampoFormulario } from '@/types/campo-formulario'
import { EscolherTipo } from './escolher-tipo'

interface Props {
  campo: CampoFormulario
  index: number
  onChange: (patch: Partial<CampoFormulario>) => void
}

/**
 * Edição completa de uma pergunta. Os campos de cada tipo são os mesmos do
 * editor de etapas dos editais; aqui só a escolha do tipo é por botões.
 */
export function DetalhesPergunta({ campo, index, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-semibold text-tinta-900">Tipo de resposta</p>
        <EscolherTipo rotulo={`Tipo da pergunta ${index + 1}`} atual={campo.tipo} onEscolher={(tipo) => onChange({ tipo })} />
      </div>
      <div className="space-y-3">
        {campo.tipo === 'info' && <CampoInfoFields campo={campo} index={index} onChange={onChange} />}
        {campo.tipo === 'tabela' && <CampoTabelaFields campo={campo} onChange={onChange} />}
        {campo.tipo === 'grupo_repetivel' && <CampoGrupoFields campo={campo} onChange={onChange} />}
        {campo.tipo !== 'info' && campo.tipo !== 'tabela' && campo.tipo !== 'grupo_repetivel' && (
          <CampoSimplesFields campo={campo} onChange={onChange} />
        )}
      </div>
    </div>
  )
}
