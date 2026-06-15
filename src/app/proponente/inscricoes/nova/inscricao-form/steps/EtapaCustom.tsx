import { Card } from '@client/components/ui'
import type { EtapaCustomizada } from '@shared/types/etapa-customizada'
import { CampoRenderer } from '../CampoRenderer'

export function EtapaCustom({
  etapa,
  valores,
  onCampoChange,
}: {
  etapa: EtapaCustomizada
  valores: Record<string, unknown>
  onCampoChange: (nome: string, valor: unknown) => void
}) {
  const visiveis = etapa.campos.filter((c) => c.tipo !== 'arquivo')
  return (
    <Card padding="lg">
      <h2 className="text-lg font-semibold text-slate-900 mb-1">{etapa.titulo}</h2>
      {etapa.descricao && (
        <p className="text-sm text-slate-500 mb-6 whitespace-pre-line">{etapa.descricao}</p>
      )}
      {!etapa.descricao && (
        <p className="text-sm text-slate-500 mb-6">
          Preencha as informações abaixo. Campos marcados com * são obrigatórios.
        </p>
      )}
      <div className="space-y-5">
        {visiveis.map((campo) => (
          <CampoRenderer
            key={campo.nome || `info_${campo.label}`}
            campo={campo}
            value={valores[campo.nome]}
            onChange={(v) => onCampoChange(campo.nome, v)}
          />
        ))}
        {visiveis.length === 0 && (
          <p className="text-slate-500 text-sm">Nenhum campo configurado nesta etapa.</p>
        )}
      </div>
    </Card>
  )
}
