import type { CampoFormulario } from '@shared/types/campo-formulario'
import type { EtapaCustomizada } from '@shared/types/etapa-customizada'
import type { TipoProponente } from '@prisma/client'

export type TipoAnexoEdital = import('@/lib/constants/attachment-types').TipoAnexo

export interface Anexo {
  id: string
  tipo: string
  titulo: string
  url: string
  createdAt: string
}

export interface ArquivoEditalDownload {
  id: string
  tipo: string
  titulo: string
  url: string
  acessivel: boolean
}

export interface EditalInfo {
  id: string
  titulo: string
  categorias: string[]
  camposFormulario: CampoFormulario[]
  tiposAnexo?: TipoAnexoEdital[] | null
  etapasCustomizadas?: EtapaCustomizada[]
  arquivos?: ArquivoEditalDownload[]
  tipoLabels?: Record<string, string>
}

export interface InscricaoFormProps {
  edital: EditalInfo
  tipoProponente?: TipoProponente | null
  // Dados existentes para edição de rascunho
  inscricaoId?: string
  initialCategoria?: string
  initialCampos?: Record<string, unknown>
  initialAnexos?: Anexo[]
}

export type Step =
  | { kind: 'categoria' }
  | { kind: 'dados' }
  | { kind: 'etapa_custom'; etapa: EtapaCustomizada }
  | { kind: 'anexos' }
  | { kind: 'revisao' }
