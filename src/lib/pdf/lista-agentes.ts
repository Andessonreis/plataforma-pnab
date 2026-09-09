/**
 * Lista de agentes culturais cadastrados na plataforma.
 *
 * Documento interno de trabalho: leva contato (e-mail e telefone) pra Secretaria
 * falar com quem se cadastrou, então não é peça publicável. As colunas vêm da
 * seleção feita na exportação — o layout se ajusta às que foram pedidas.
 */
import { createDocument, docToBuffer, MARGINS, CONTENT_WIDTH, COLORS } from './shared'
import {
  addCompactHeader,
  addInfoBlock,
  addDivider,
  addLegalNotice,
  addCompactFooter,
  addCompactSection,
} from './layout-helpers'
import {
  addTableEmptyRow,
  addTableHeader,
  addTableRow,
  calculateRowHeight,
  checkPageBreak,
  type ColumnDef,
  type PageContext,
} from './table-helpers'
import {
  DEFINICOES_CAMPO,
  labelDoCampo,
  valorDoCampo,
  type AgenteRow,
  type CampoAgente,
} from '@/lib/agentes/campos'

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface ListaAgentesData {
  /** Título do documento; padrão cobre o caso mais comum. */
  titulo?: string
  /** Filtros aplicados, exibidos no cabeçalho pra o documento se explicar. */
  filtros: Array<{ label: string; value: string }>
  campos: CampoAgente[]
  agentes: AgenteRow[]
}

// ─── Colunas ─────────────────────────────────────────────────────────────────

const COLUNA_ORDEM: ColumnDef = { label: 'Nº', width: 24 }

/**
 * Distribui a largura útil entre as colunas escolhidas, proporcional ao peso
 * de cada campo. A sobra da divisão vai pra última coluna, pra tabela fechar
 * exatamente na largura da página.
 */
function montarColunas(campos: CampoAgente[]): ColumnDef[] {
  const disponivel = CONTENT_WIDTH - COLUNA_ORDEM.width
  const somaPesos = campos.reduce((acc, campo) => acc + DEFINICOES_CAMPO[campo].peso, 0)

  const colunas = campos.map((campo) => ({
    label: labelDoCampo(campo),
    width: Math.floor((DEFINICOES_CAMPO[campo].peso / somaPesos) * disponivel),
  }))

  const usado = colunas.reduce((acc, c) => acc + c.width, 0)
  if (colunas.length > 0) {
    colunas[colunas.length - 1].width += disponivel - usado
  }

  return [COLUNA_ORDEM, ...colunas]
}

// ─── Geração do PDF ──────────────────────────────────────────────────────────

export async function generateListaAgentes(data: ListaAgentesData): Promise<Buffer> {
  const doc = createDocument()
  const ctx: PageContext = { pageNum: 1 }
  const colunas = montarColunas(data.campos)
  const total = data.agentes.length

  addCompactHeader(doc, data.titulo ?? 'Agentes Culturais Cadastrados')

  addInfoBlock(doc, [
    ...data.filtros,
    { label: 'Total de cadastros', value: String(total) },
  ])
  addDivider(doc)

  addCompactSection(doc, 'Cadastros')
  addTableHeader(doc, colunas)

  if (total === 0) {
    addTableEmptyRow(doc, 'Nenhum cadastro encontrado para os filtros aplicados.')
  } else {
    for (let i = 0; i < total; i++) {
      const values = [
        String(i + 1),
        ...data.campos.map((campo) =>
          valorDoCampo(data.agentes[i], campo, { mascararDocumento: true }),
        ),
      ]
      const rowHeight = calculateRowHeight(doc, colunas, values)

      checkPageBreak(doc, rowHeight + 2, ctx, colunas)
      addTableRow(doc, colunas, values, i % 2 === 0, rowHeight)
    }
  }

  doc.y += 8
  checkPageBreak(doc, 30, ctx)
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(COLORS.text)
    .text(`Total: ${total} cadastro(s)`, MARGINS.left)

  checkPageBreak(doc, 60, ctx)
  addLegalNotice(
    doc,
    'Documento interno de trabalho gerado pela plataforma Portal PNAB Irecê. ' +
    'Relaciona os cadastros existentes no sistema na data de geração, com dados de contato ' +
    'para uso da equipe da Secretaria. Contém dados pessoais protegidos pela LGPD: não deve ' +
    'ser publicado nem compartilhado fora da Secretaria.',
  )

  addCompactFooter(doc, ctx.pageNum)

  return docToBuffer(doc)
}
