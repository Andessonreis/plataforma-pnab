import { Card, Badge } from '@client/components/ui'
import type { CampoFormulario } from '@shared/types/campo-formulario'
import type { EtapaCustomizada } from '@shared/types/etapa-customizada'
import { CampoRevisao } from '../CampoRevisao'
import type { Anexo, TipoAnexoEdital } from '../types'

export function EtapaRevisao({
  hasCategorias,
  categoria,
  camposFormulario,
  etapasCustomizadas,
  valores,
  anexos,
  tiposAnexoEdital,
}: {
  hasCategorias: boolean
  categoria: string
  camposFormulario: CampoFormulario[]
  etapasCustomizadas: EtapaCustomizada[]
  valores: Record<string, unknown>
  anexos: Anexo[]
  tiposAnexoEdital?: TipoAnexoEdital[] | null
}) {
  return (
    <Card padding="lg">
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Revisão da Inscrição</h2>
      <p className="text-sm text-slate-500 mb-6">
        Confira os dados antes de enviar. Após o envio, a inscrição não poderá ser alterada.
      </p>

      <div className="space-y-6">
        {/* Categoria */}
        {hasCategorias && (
          <div>
            <h3 className="text-sm font-medium text-slate-500 mb-1">Categoria</h3>
            <p className="text-slate-900">{categoria || <span className="text-red-500">Não selecionada</span>}</p>
          </div>
        )}

        {/* Campos da etapa "Dados" */}
        <div>
          <h3 className="text-sm font-medium text-slate-500 mb-3">Dados do Projeto</h3>
          <dl className="space-y-3">
            {camposFormulario
              .filter((c) => c.tipo !== 'arquivo')
              .map((campo) => (
                <CampoRevisao
                  key={campo.nome || `info_${campo.label}`}
                  campo={campo}
                  value={valores[campo.nome]}
                />
              ))}
          </dl>
        </div>

        {/* Etapas customizadas */}
        {etapasCustomizadas.map((etapa) => (
          <div key={etapa.id}>
            <h3 className="text-sm font-medium text-slate-500 mb-3">{etapa.titulo}</h3>
            <dl className="space-y-3">
              {etapa.campos.filter((c) => c.tipo !== 'arquivo').map((campo) => (
                <CampoRevisao
                  key={campo.nome || `info_${campo.label}`}
                  campo={campo}
                  value={valores[campo.nome]}
                />
              ))}
            </dl>
          </div>
        ))}

        {/* Anexos */}
        <div>
          <h3 className="text-sm font-medium text-slate-500 mb-2">
            Anexos ({anexos.length})
          </h3>
          {anexos.length === 0 ? (
            <p className="text-sm text-red-500 italic">Nenhum anexo enviado</p>
          ) : (
            <ul className="space-y-2">
              {anexos.map((a) => (
                <li key={a.id} className="flex items-center gap-2 text-sm text-slate-700">
                  <Badge variant="neutral">{a.tipo}</Badge>
                  {a.titulo}
                </li>
              ))}
            </ul>
          )}
          {/* Alerta de anexos obrigatórios faltantes */}
          {(() => {
            const obrigatorios = tiposAnexoEdital?.filter(t => t.obrigatorio) ?? []
            const faltantes = obrigatorios.filter(t =>
              !anexos.some(a => a.tipo === t.tipo)
            )
            if (faltantes.length === 0) return null
            return (
              <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700" role="alert">
                <strong>Anexos obrigatórios faltantes:</strong>{' '}
                {faltantes.map(f => f.label).join(', ')}
              </div>
            )
          })()}
        </div>
      </div>
    </Card>
  )
}
