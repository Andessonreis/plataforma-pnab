'use client'

import { Card, Badge } from '@/components/ui'
import type { CampoFormulario } from '@/types/campo-formulario'
import type { EtapaCustomizada } from '@/types/etapa-customizada'
import type { CategoriaConfig } from '@/types/categoria-config'
import type { TipoAnexo } from '@/lib/constants/attachment-types'
import type { Anexo } from '@/types/anexo'
import { CampoRevisaoRenderer } from './campo-revisao-renderer'
import { RevisaoAnexos } from './revisao-anexos'

interface StepRevisaoProps {
  hasCategorias: boolean
  categoria: string
  categoriaConfig?: CategoriaConfig
  cotasOptIn: string[]
  camposFormulario: CampoFormulario[]
  etapasCustomizadas: EtapaCustomizada[]
  values: Record<string, unknown>
  submissaoPorVideo: boolean
  anexoVideoSubstitutivo: Anexo | null
  anexos: Anexo[]
  tiposAnexoEdital?: TipoAnexo[] | null
}

export function StepRevisao({
  hasCategorias,
  categoria,
  categoriaConfig,
  cotasOptIn,
  camposFormulario,
  etapasCustomizadas,
  values,
  submissaoPorVideo,
  anexoVideoSubstitutivo,
  anexos,
  tiposAnexoEdital,
}: StepRevisaoProps) {
  return (
    <Card padding="lg">
      <h2 className="text-xl font-semibold text-slate-900 mb-1">Revisão da Inscrição</h2>
      <p className="text-sm text-slate-600 mb-6">
        Confira os dados antes de enviar. Após o envio, a inscrição não poderá ser alterada.
      </p>

      <div className="space-y-6">
        {hasCategorias && (
          <div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">Categoria</h3>
            {categoria ? (
              <p className="text-slate-900">{categoria}</p>
            ) : (
              <Badge variant="error">Não selecionada</Badge>
            )}
            {cotasOptIn.length > 0 && (
              <p className="text-sm text-slate-600 mt-1">
                Concorrendo às cotas:{' '}
                {cotasOptIn
                  .map((key) => categoriaConfig?.cotas.find((c) => c.key === key)?.label ?? key)
                  .join(', ')}
              </p>
            )}
          </div>
        )}

        <div>
          <h3 className="text-base font-semibold text-slate-900 mb-3">Dados do Projeto</h3>
          <dl className="space-y-3">
            {camposFormulario
              .filter((c) => c.tipo !== 'arquivo')
              .map((campo) => (
                <CampoRevisaoRenderer key={campo.nome || `info_${campo.label}`} campo={campo} value={values[campo.nome]} />
              ))}
          </dl>
        </div>

        {submissaoPorVideo && anexoVideoSubstitutivo && (
          <div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">Vídeo da inscrição</h3>
            <p className="text-slate-900 text-sm break-all">{anexoVideoSubstitutivo.url}</p>
          </div>
        )}

        {!submissaoPorVideo && etapasCustomizadas.map((etapa) => (
          <div key={etapa.id}>
            <h3 className="text-base font-semibold text-slate-900 mb-3">{etapa.titulo}</h3>
            <dl className="space-y-3">
              {etapa.campos.filter((c) => c.tipo !== 'arquivo').map((campo) => (
                <CampoRevisaoRenderer key={campo.nome || `info_${campo.label}`} campo={campo} value={values[campo.nome]} />
              ))}
            </dl>
          </div>
        ))}

        <RevisaoAnexos anexos={anexos} tiposAnexoEdital={tiposAnexoEdital} />
      </div>
    </Card>
  )
}
