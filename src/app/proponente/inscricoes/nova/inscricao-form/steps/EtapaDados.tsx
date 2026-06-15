import { Card } from '@client/components/ui'
import type { CampoFormulario } from '@shared/types/campo-formulario'
import { CampoRenderer } from '../CampoRenderer'

export function EtapaDados({
  campos,
  valores,
  onCampoChange,
}: {
  campos: CampoFormulario[]
  valores: Record<string, unknown>
  onCampoChange: (nome: string, valor: unknown) => void
}) {
  const visiveis = campos.filter((c) => c.tipo !== 'arquivo')
  return (
    <Card padding="lg">
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Dados do Projeto</h2>
      <p className="text-sm text-slate-500 mb-6">
        Preencha os dados da sua proposta. Campos marcados com * são obrigatórios.
      </p>
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
          <p className="text-slate-500 text-sm">
            Nenhum campo configurado para este edital.
          </p>
        )}
      </div>
    </Card>
  )
}
