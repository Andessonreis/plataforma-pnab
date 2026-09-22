import PDFDocument from 'pdfkit'
import { NOME_ORGAO, PAGINA, LARGURA_UTIL } from '@/lib/pdf/documento-oficial/tema'

/**
 * Tema da versão 1 dos documentos — o layout que o portal usava antes do
 * redesenho pelo padrão do Diário Oficial.
 *
 * É a paleta institucional da plataforma (verde da marca, cinzas de apoio) e
 * uma folha de margens folgadas, em Helvetica. A largura útil e as margens
 * laterais vêm do tema dos documentos oficiais: as duas versões imprimem no
 * mesmo A4, e ter duas contas da mesma medida foi o que já causou tabela
 * estourando a margem.
 */

export const COLORS = {
  brand: '#059669',
  brandDark: '#047857',
  accent: '#d97706',
  text: '#1e293b',
  textLight: '#64748b',
  border: '#e2e8f0',
  background: '#f8fafc',
  white: '#ffffff',
} as const

export const MARGINS = {
  top: 60,
  bottom: 60,
  left: PAGINA.margem.esquerda,
  right: PAGINA.margem.direita,
} as const

/** Assinatura da plataforma no cabeçalho e no rodapé de toda folha. */
export const NOME_PORTAL = 'Portal PNAB Irecê'

export { NOME_ORGAO, PAGINA, LARGURA_UTIL }

/**
 * Abre a folha da versão 1 já com os metadados do arquivo.
 *
 * O título do documento vai em `Info.Title` — é o que o leitor de PDF mostra na
 * aba e o que identifica a peça quando ela é anexada a um processo. Serializar
 * é responsabilidade do `docParaBuffer` do documento oficial, o mesmo das duas
 * versões.
 */
export function criarDocumento(titulo: string): PDFKit.PDFDocument {
  return new PDFDocument({
    size: 'A4',
    margins: { ...MARGINS },
    info: {
      Title: titulo,
      Author: NOME_ORGAO,
      Creator: NOME_PORTAL,
    },
  })
}
