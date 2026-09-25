import { tituloDocumento } from '@/lib/documentos/titulos'
import {
  avisoLegalRecursos, SEM_RECURSO, colunasRecursos, conclusao, identificacaoRecursos, valoresDoRecurso,
} from '@/lib/pdf/modelo/relatorio-recursos'
import type { RelatorioRecursosData } from '@/lib/pdf/modelo/tipos'
import { desenharAvisoLegal, desenharBlocoInfo, desenharDivisor, desenharSecao } from './blocos'
import { desenharCabecalhoCompacto } from './cabecalho'
import { abrirDocumento, finalizarDocumento, garantirEspaco } from './pagina'
import { desenharTabela } from './tabela'
import { COLORS, LARGURA_UTIL, MARGINS } from './tema'

/**
 * Extrato dos recursos de uma etapa no layout da versão 1: cabeçalho compacto,
 * identificação em pares, tabela zebrada e conclusão. É o desenho das peças que
 * a Secretaria já publicou, com o mesmo conteúdo da versão 2.
 */
export async function gerarRelatorioRecursosV1(data: RelatorioRecursosData): Promise<Buffer> {
  const titulo = tituloDocumento({ tipo: 'RELATORIO_RECURSOS', edital: data.edital, etapa: data.etapa })
  const doc = abrirDocumento({
    titulo,
    emissao: data.emissao ?? null,
    aoAbrirPagina: (folha) => desenharCabecalhoCompacto(folha, titulo),
  })

  desenharBlocoInfo(doc, identificacaoRecursos(data))
  desenharDivisor(doc)

  desenharSecao(doc, 'Recursos interpostos')
  desenharTabela(
    doc,
    colunasRecursos(data),
    data.recursos.map((recurso) => ({ valores: valoresDoRecurso(recurso, data) })),
    { vazio: SEM_RECURSO },
  )

  doc.y += 8
  garantirEspaco(doc, 30)
  doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.text)
    .text(`Total: ${data.recursos.length} recurso(s)`, MARGINS.left, doc.y, { width: LARGURA_UTIL })

  garantirEspaco(doc, 60)
  desenharSecao(doc, 'Conclusão')
  doc.font('Helvetica').fontSize(9.5).fillColor(COLORS.text)
    .text(conclusao(data), MARGINS.left, doc.y, { width: LARGURA_UTIL, align: 'justify', lineGap: 2 })

  garantirEspaco(doc, 50)
  desenharAvisoLegal(doc, avisoLegalRecursos(data))

  return finalizarDocumento(doc)
}
