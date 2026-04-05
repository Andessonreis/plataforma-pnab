// Tipos de anexo compartilhados entre admin (edital-form) e proponente (inscricao-form)

export interface TipoAnexo {
  tipo: string
  label: string
  obrigatorio: boolean
}

/**
 * 7 tipos padrão PNAB — usados como fallback quando o edital não define tipos customizados.
 */
export const PNAB_DEFAULT_ATTACHMENT_TYPES: TipoAnexo[] = [
  { tipo: 'DOCUMENTO_PESSOAL', label: 'Documento Pessoal', obrigatorio: true },
  { tipo: 'COMPROVANTE_ENDERECO', label: 'Comprovante de Endereço', obrigatorio: true },
  { tipo: 'PORTFOLIO', label: 'Portfólio / Currículo', obrigatorio: false },
  { tipo: 'PROJETO', label: 'Projeto / Proposta', obrigatorio: true },
  { tipo: 'ORCAMENTO', label: 'Orçamento', obrigatorio: false },
  { tipo: 'DECLARACAO', label: 'Declaração', obrigatorio: false },
  { tipo: 'OUTRO', label: 'Outro', obrigatorio: false },
]

/**
 * Tipos padrão para documentos do edital (seção 7) — fallback caso a API falhe.
 */
export interface TipoDocumentoEdital {
  value: string
  label: string
}

export const EDITAL_DOCUMENT_DEFAULT_TYPES: TipoDocumentoEdital[] = [
  { value: 'PDF_EDITAL', label: 'PDF do Edital' },
  { value: 'ANEXO_EDITAL', label: 'Anexo' },
  { value: 'MODELO_EDITAL', label: 'Modelo' },
  { value: 'PLANILHA_EDITAL', label: 'Planilha' },
  { value: 'DECLARACAO_EDITAL', label: 'Declaração' },
]
