/**
 * Relatório dos recursos interpostos numa etapa do edital.
 *
 * Documento de publicação: ao encerrar cada prazo recursal do cronograma, a
 * Secretaria precisa tornar público o que foi recebido — inclusive quando não
 * houve recurso algum, caso em que a tabela vazia é a própria prova.
 *
 * Segue o mesmo layout da relação de inscritos (mesmo header, mesma tabela)
 * para que as peças publicadas do edital tenham a mesma aparência.
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
} from './table-helpers'
import { criarDocumentoOficial, finalizarDocumento } from './documento-oficial'
import { CORES, FONTES, LARGURA_UTIL, X_ESQUERDA } from './documento-oficial/tema'
import type { RelatorioRecursosData, RelatorioRecursosItem } from './modelo/tipos'
import {
  avisoLegalRecursos, SEM_RECURSO, colunasRecursos, conclusao, descreverPrazo,
  identificacaoRecursos, valoresDoRecurso,
} from './modelo/relatorio-recursos'

export type { RelatorioRecursosData, RelatorioRecursosItem }
export { conclusao }

// ─── Geração do PDF ──────────────────────────────────────────────────────────

export async function generateRelatorioRecursos(data: RelatorioRecursosData): Promise<Buffer> {
  const doc = await criarDocumentoOficial({
    rotulo: 'Recursos',
    titulo: `Relatório de Recursos Interpostos - ${data.etapa}`,
    subtitulo: `${data.edital.titulo} · ${data.edital.ano}`,
    emissao: data.emissao ?? null,
  })
  const total = data.recursos.length
  const colunas = colunasRecursos(data)

  addInfoBlock(doc, identificacaoRecursos(data))
  addDivider(doc)

  addCompactSection(doc, 'Recursos interpostos')
  addTableHeader(doc, colunas)

  if (total === 0) {
    addTableEmptyRow(doc, SEM_RECURSO)
  } else {
    for (const recurso of data.recursos) {
      const values = valoresDoRecurso(recurso, data)
      const rowHeight = calculateRowHeight(doc, colunas, values)

      checkPageBreak(doc, rowHeight + 2, colunas)
      addTableRow(doc, colunas, values, rowHeight)
    }
  }

  doc.y += 8
  checkPageBreak(doc, 30)
  doc.font(FONTES.rotulo).fontSize(9).fillColor(CORES.tinta)
    .text(`Total: ${total} recurso(s)`, X_ESQUERDA, doc.y, { width: LARGURA_UTIL })

  checkPageBreak(doc, 60)
  addCompactSection(doc, 'Conclusão')
  doc.font(FONTES.corpo).fontSize(9.5).fillColor(CORES.texto)
    .text(conclusao(data), X_ESQUERDA, doc.y, {
      width: LARGURA_UTIL, align: 'justify', lineGap: 2,
    })

  checkPageBreak(doc, 50)
  addLegalNotice(doc, avisoLegalRecursos(data))

  return finalizarDocumento(doc, [
    { rotulo: 'Documento', valor: 'Relatório de recursos interpostos' },
    { rotulo: 'Edital', valor: `${data.edital.titulo} (${data.edital.ano})` },
    { rotulo: 'Etapa', valor: data.etapa },
    { rotulo: 'Prazo', valor: descreverPrazo(data.prazo) },
    { rotulo: 'Recursos', valor: String(total) },
  ])
}
