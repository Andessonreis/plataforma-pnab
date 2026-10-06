import { abrirDocumento, finalizarDocumento, garantirEspaco } from './template-1/pagina'
import { desenharCabecalhoCompacto } from './template-1/cabecalho'
import { desenharBlocoInfo, desenharDivisor, desenharAvisoLegal } from './template-1/blocos'
import { desenharTabela, type ColunaTabela, type LinhaTabela, type EstiloCelula } from './template-1/tabela'
import { COLORS, LARGURA_UTIL, MARGINS } from './template-1/tema'
import { maskCpfCnpj } from '@/lib/utils/mask'
import { dataHora } from './documento-oficial/tema'
import { CATEGORIAS_HABILITACAO_FESTIVAL } from '@/lib/edital/dados-habilitados-festival'

const ALTURA_TARJA = 17
const ALTURA_QUADRO = 13

function desenharTarja(doc: PDFKit.PDFDocument, nome: string): void {
  const y = doc.y
  doc.rect(MARGINS.left, y, LARGURA_UTIL, ALTURA_TARJA).fill(COLORS.brand)
  doc.font('Helvetica-Bold').fontSize(8.8).fillColor(COLORS.white)
    .text(nome, MARGINS.left + 7, y + 4.5, { width: LARGURA_UTIL - 14, lineBreak: false })
  doc.y = y + ALTURA_TARJA
}

function desenharQuadroInfo(doc: PDFKit.PDFDocument, info: string): void {
  const y = doc.y
  doc.rect(MARGINS.left, y, LARGURA_UTIL, ALTURA_QUADRO).fillAndStroke(COLORS.background, COLORS.border)
  doc.font('Helvetica-Bold').fontSize(6.8).fillColor(COLORS.brandDark)
    .text(info, MARGINS.left + 7, y + 3.4, { width: LARGURA_UTIL - 14, lineBreak: false })
  doc.y = y + ALTURA_QUADRO
}

export async function gerarPdfHabilitadosFestival(agora: Date = new Date()): Promise<Buffer> {
  const titulo = 'Relação de Habilitados Final após entrega de documentação'
  const editalTitulo = 'Festival de Arte e Cultura de Irecê — Centenário da Cidade'
  const ano = '2026'

  let primeiraFolha = true
  const doc = abrirDocumento({
    titulo: `${titulo} — ${editalTitulo}`,
    geradoEm: agora,
    aoAbrirPagina: (folha) => {
      desenharCabecalhoCompacto(folha, primeiraFolha ? titulo : `${titulo} (continuação)`)
      primeiraFolha = false
    },
  })

  const totalConvocados = CATEGORIAS_HABILITACAO_FESTIVAL.reduce((acc, c) => acc + c.propostas.length, 0)
  const totalHabilitados = CATEGORIAS_HABILITACAO_FESTIVAL.reduce((acc, c) => acc + c.propostas.filter((p) => p.habilitado).length, 0)
  const totalInabilitados = totalConvocados - totalHabilitados
  const resultadoFaseTexto =
    totalInabilitados === 1
      ? `${totalHabilitados} Habilitadas  ·  1 Desclassificada (sem recurso)`
      : `${totalHabilitados} Habilitadas  ·  ${totalInabilitados} Inabilitadas com pendências`

  // Bloco de Identificação
  desenharBlocoInfo(doc, [
    { label: 'Edital', value: editalTitulo },
    { label: 'Ano', value: ano },
    { label: 'Etapa / Fase', value: 'Habilitação Documental Presencial — Convocação dos Contemplados' },
    { label: 'Data de Emissão', value: dataHora(agora) },
    { label: 'Total Convocado', value: `${totalConvocados} propostas analisadas na fase de habilitação` },
    { label: 'Resultado da Fase', value: resultadoFaseTexto },
  ])
  desenharDivisor(doc)

  const colunas: ColunaTabela[] = [
    { label: 'POS.', width: 25, align: 'center' },
    { label: 'INSCRIÇÃO', width: 73 },
    { label: 'PROPONENTE', width: 136.28 },
    { label: 'CPF / CNPJ', width: 76, align: 'center' },
    { label: 'SITUAÇÃO', width: 70, align: 'center' },
    { label: 'MOTIVO', width: 115 },
  ]

  for (const cat of CATEGORIAS_HABILITACAO_FESTIVAL) {
    const alturaMinima = ALTURA_TARJA + (cat.vagasInfo ? ALTURA_QUADRO : 0) + 25 + Math.min(cat.propostas.length, 3) * 22
    garantirEspaco(doc, alturaMinima)
    desenharTarja(doc, cat.nome)
    if (cat.vagasInfo) {
      desenharQuadroInfo(doc, cat.vagasInfo)
    }

    const linhas: LinhaTabela[] = cat.propostas.map((prop) => {
      const celulas: (EstiloCelula | undefined)[] = [
        undefined,
        { negrito: true },
        { negrito: true },
        undefined,
        undefined,
        prop.habilitado ? { cor: COLORS.apagado } : undefined,
      ]

      return {
        valores: [
          `${prop.posicao}º`,
          prop.numero,
          prop.nome,
          maskCpfCnpj(prop.cpfCnpj),
          prop.habilitado ? 'Habilitado' : (prop.situacao ?? 'Inabilitado'),
          prop.habilitado ? '—' : (prop.motivo ?? 'Pendência/Ausência de documentação'),
        ],
        celulas,
      }
    })

    desenharTabela(doc, colunas, linhas, { fios: true })
    doc.y += 10
  }

  // Aviso Legal de encerramento
  garantirEspaco(doc, 45)
  desenharAvisoLegal(
    doc,
    'Este documento é a publicação oficial da fase de habilitação documental dos projetos convocados, referente ao Edital Festival de Arte e Cultura de Irecê — Centenário da Cidade (2026). Os dados apresentados correspondem às informações registradas pela Secretaria Municipal de Cultura e Turismo de Irecê/BA.',
  )

  return finalizarDocumento(doc)
}
