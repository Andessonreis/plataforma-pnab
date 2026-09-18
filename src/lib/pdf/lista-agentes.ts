/**
 * Lista de agentes culturais cadastrados na plataforma.
 *
 * Documento interno de trabalho: leva contato (e-mail e telefone) pra Secretaria
 * falar com quem se cadastrou, então não é peça publicável. As colunas vêm da
 * seleção feita na exportação — o layout se ajusta às que foram pedidas.
 */
import {
  addInfoBlock,
  addDivider,
  addLegalNotice,
  addCompactSection,
} from './layout-helpers'
import {
  addTableEmptyRow,
  addTableHeader,
  addTableRow,
  calculateRowHeight,
  checkPageBreak,
  type ColumnDef,
} from './table-helpers'
import {
  DEFINICOES_CAMPO,
  labelDoCampo,
  valorDoCampo,
  type AgenteRow,
  type CampoAgente,
} from '@/lib/agentes/campos'
import type { Emissao } from '@/lib/documentos/emissao'
import { criarDocumentoOficial, finalizarDocumento } from './documento-oficial'
import { CORES, FONTES, LARGURA_UTIL, X_ESQUERDA } from './documento-oficial/tema'

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface ListaAgentesData {
  /** Título do documento; padrão cobre o caso mais comum. */
  titulo?: string
  /** Filtros aplicados, exibidos no cabeçalho pra o documento se explicar. */
  filtros: Array<{ label: string; value: string }>
  campos: CampoAgente[]
  agentes: AgenteRow[]
  /** Registro de emissão; null quando o registro falhou (o PDF sai mesmo assim). */
  emissao?: Emissao | null
}

// ─── Colunas ─────────────────────────────────────────────────────────────────

const COLUNA_ORDEM: ColumnDef = { label: 'Nº', width: 24 }

/**
 * Distribui a largura útil entre as colunas escolhidas, proporcional ao peso
 * de cada campo. A sobra da divisão vai pra última coluna, pra tabela fechar
 * exatamente na largura da página.
 */
function montarColunas(campos: CampoAgente[]): ColumnDef[] {
  const disponivel = LARGURA_UTIL - COLUNA_ORDEM.width
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
  const titulo = data.titulo ?? 'Agentes Culturais Cadastrados'
  const doc = await criarDocumentoOficial({
    rotulo: 'Agentes culturais',
    titulo,
    emissao: data.emissao ?? null,
    aviso: 'Documento interno de trabalho. Relaciona dados de contato dos agentes cadastrados, '
      + 'protegidos pela LGPD — não deve ser publicado nem compartilhado fora da Secretaria.',
  })
  const colunas = montarColunas(data.campos)
  const total = data.agentes.length

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

      checkPageBreak(doc, rowHeight + 2, colunas)
      addTableRow(doc, colunas, values, rowHeight)
    }
  }

  doc.y += 8
  checkPageBreak(doc, 30)
  doc.font(FONTES.rotulo).fontSize(9).fillColor(CORES.tinta)
    .text(`Total: ${total} cadastro(s)`, X_ESQUERDA, doc.y, { width: LARGURA_UTIL })

  checkPageBreak(doc, 60)
  addLegalNotice(
    doc,
    'Documento interno de trabalho gerado pela plataforma Portal PNAB Irecê. ' +
    'Relaciona os cadastros existentes no sistema na data de geração, com dados de contato ' +
    'para uso da equipe da Secretaria. Contém dados pessoais protegidos pela LGPD: não deve ' +
    'ser publicado nem compartilhado fora da Secretaria.',
  )

  return finalizarDocumento(doc, [
    { rotulo: 'Documento', valor: titulo },
    { rotulo: 'Registros', valor: String(total) },
    { rotulo: 'Uso', valor: 'Interno — contém dados pessoais' },
  ])
}
