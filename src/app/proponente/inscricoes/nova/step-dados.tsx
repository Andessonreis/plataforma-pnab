'use client'

import { Card } from '@/components/ui'
import type { CampoFormulario } from '@/types/campo-formulario'
import { CampoRenderer } from './campo-renderer'

interface StepDadosProps {
  campos: CampoFormulario[]
  values: Record<string, unknown>
  onChange: (nome: string, valor: unknown) => void
}

export function StepDados({ campos, values, onChange }: StepDadosProps) {
  const preenchiveis = campos.filter((c) => c.tipo !== 'arquivo')
  return (
    <Card padding="lg">
      <h2 className="text-xl font-semibold text-slate-900 mb-1">Dados do Projeto</h2>
      <p className="text-sm text-slate-600 mb-6">
        Preencha os dados da sua proposta. Campos marcados com * são obrigatórios.
      </p>
      <div className="space-y-5">
        {preenchiveis.map((campo) => (
          <CampoRenderer
            key={campo.nome || `info_${campo.label}`}
            campo={campo}
            value={values[campo.nome]}
            onChange={(v) => onChange(campo.nome, v)}
          />
        ))}
        {preenchiveis.length === 0 && (
          <p className="text-slate-500 text-sm">
            Nenhum campo configurado para este edital.
          </p>
        )}
      </div>
    </Card>
  )
}
