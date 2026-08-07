'use client'

import { Card } from '@/components/ui'
import type { EtapaCustomizada } from '@/types/etapa-customizada'
import { CampoRenderer } from './campo-renderer'

interface StepEtapaCustomProps {
  etapa: EtapaCustomizada
  values: Record<string, unknown>
  onChange: (nome: string, valor: unknown) => void
}

export function StepEtapaCustom({ etapa, values, onChange }: StepEtapaCustomProps) {
  const preenchiveis = etapa.campos.filter((c) => c.tipo !== 'arquivo')
  return (
    <Card padding="lg">
      <h2 className="text-xl font-semibold text-slate-900 mb-1">{etapa.titulo}</h2>
      {etapa.descricao ? (
        <p className="text-sm text-slate-600 mb-6 whitespace-pre-line">{etapa.descricao}</p>
      ) : (
        <p className="text-sm text-slate-600 mb-6">
          Preencha as informações abaixo. Campos marcados com * são obrigatórios.
        </p>
      )}
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
          <p className="text-slate-500 text-sm">Nenhum campo configurado nesta etapa.</p>
        )}
      </div>
    </Card>
  )
}
