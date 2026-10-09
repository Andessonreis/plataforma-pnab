import { abrirDocumento, finalizarDocumento, garantirEspaco } from './template-1/pagina'
import { desenharCabecalhoCompacto } from './template-1/cabecalho'
import { desenharBlocoInfo, desenharDivisor, desenharAvisoLegal } from './template-1/blocos'
import { desenharTabela, type ColunaTabela, type LinhaTabela, type EstiloCelula } from './template-1/tabela'
import { COLORS, LARGURA_UTIL, MARGINS } from './template-1/tema'
import { dataHora } from './documento-oficial/tema'
import { textoParaPdf } from './texto-winansi'

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
  doc.font('Helvetica-Bold').fontSize(6.8).fillColor(COLORS.textLight)
    .text(info, MARGINS.left + 7, y + 3.4, { width: LARGURA_UTIL - 14, lineBreak: false })
  doc.y = y + ALTURA_QUADRO
}

function desenharObservacao(doc: PDFKit.PDFDocument, texto: string, rotulo = 'Observação'): void {
  const RECUO = 8
  const largura = LARGURA_UTIL - RECUO * 2
  doc.font('Helvetica-Oblique').fontSize(7.5)
  const altura = doc.heightOfString(`${rotulo}: ${texto}`, { width: largura }) + 10
  garantirEspaco(doc, altura + 4)
  const y = doc.y + 4
  doc.rect(MARGINS.left, y, LARGURA_UTIL, altura).fill(COLORS.background)
  doc.fillColor(COLORS.text).font('Helvetica-Bold').text(`${rotulo}: `, MARGINS.left + RECUO, y + 5, { continued: true, width: largura })
    .font('Helvetica-Oblique').text(texto)
  doc.y = y + altura
}

export const DADOS_CONVOCACAO_SUPLENTE = {
  titulo: 'Convocação de Suplente',
  editalTitulo: 'Festival de Arte e Cultura de Irecê — Centenário da Cidade',
  editalNumero: 'Edital de Chamamento Público Nº 02/2026',
  ano: '2026',
  categoria: 'CULTURA POPULAR',
  vagasInfo: '4 vaga(s) · Vaga Remanescente de Suplência · R$ 5.000,00 por projeto',
  suplentes: [
    {
      posicao: 4,
      ordem: '1º suplente',
      numero: 'PNAB-2026-0060',
      nome: 'José Adenildo de Oliveira',
      cpfCnpj: '***.101.985-**',
      notaFinal: '77.00',
      situacao: 'Desclassificado',
      motivo: 'Agente contemplado no Edital 03/2026 - Premiação mestres.',
      classificado: false,
    },
    {
      posicao: 5,
      ordem: '2º suplente',
      numero: 'PNAB-2026-0091',
      nome: 'AME Capoeira',
      cpfCnpj: '**.025.456/0001-**',
      notaFinal: '61.00',
      situacao: 'Classificado',
      motivo: 'Suplente Classificado — Convocado para vaga remanescente',
      classificado: true,
    },
  ],
}

export async function gerarPdfConvocacaoSuplente(agora: Date = new Date()): Promise<Buffer> {
  const titulo = DADOS_CONVOCACAO_SUPLENTE.titulo
  const editalTitulo = DADOS_CONVOCACAO_SUPLENTE.editalTitulo
  const ano = DADOS_CONVOCACAO_SUPLENTE.ano

  let primeiraFolha = true
  const doc = abrirDocumento({
    titulo: `${titulo} — ${editalTitulo}`,
    geradoEm: agora,
    aoAbrirPagina: (folha) => {
      desenharCabecalhoCompacto(folha, primeiraFolha ? titulo : `${titulo} (continuação)`)
      primeiraFolha = false
    },
  })

  // Bloco de Identificação
  desenharBlocoInfo(doc, [
    { label: 'Edital', value: `${DADOS_CONVOCACAO_SUPLENTE.editalNumero} — ${editalTitulo}` },
    { label: 'Ano', value: ano },
    { label: 'Etapa / Fase', value: 'Convocação de Suplente — Habilitação Documental' },
    { label: 'Categoria', value: DADOS_CONVOCACAO_SUPLENTE.categoria },
    { label: 'Data de Emissão', value: dataHora(agora) },
    { label: 'Objeto', value: 'Convocação de proposta suplente para preenchimento de vaga remanescente' },
  ])
  desenharDivisor(doc)

  // Tarja e Quadro da Categoria
  garantirEspaco(doc, ALTURA_TARJA + ALTURA_QUADRO + 140)
  desenharTarja(doc, DADOS_CONVOCACAO_SUPLENTE.categoria)
  desenharQuadroInfo(doc, DADOS_CONVOCACAO_SUPLENTE.vagasInfo)

  const colunas: ColunaTabela[] = [
    { label: 'POS.', width: 28, align: 'center' },
    { label: 'INSCRIÇÃO', width: 75 },
    { label: 'PROPONENTE', width: 126.28 },
    { label: 'CPF / CNPJ', width: 76, align: 'center' },
    { label: 'SITUAÇÃO', width: 70, align: 'center' },
    { label: 'MOTIVO / JUSTIFICATIVA', width: 120 },
  ]

  const linhas: LinhaTabela[] = DADOS_CONVOCACAO_SUPLENTE.suplentes.map((prop) => {
    const celulas: (EstiloCelula | undefined)[] = [
      undefined,
      { negrito: true },
      { negrito: true },
      undefined,
      { negrito: true },
      undefined,
    ]

    return {
      valores: [
        `${prop.posicao}º`,
        prop.numero,
        prop.nome,
        prop.cpfCnpj,
        prop.situacao,
        prop.motivo,
      ],
      celulas,
      destaque: undefined,
    }
  })

  desenharTabela(doc, colunas, linhas, { fios: true })
  doc.y += 6

  // Observações detalhadas
  desenharObservacao(
    doc,
    textoParaPdf(
      'O proponente da inscrição PNAB-2026-0060 (José Adenildo de Oliveira, 1º suplente na ordem) foi declarado Desclassificado em razão de já constar como Agente contemplado no Edital 03/2026 - Premiação mestres (Edital de Chamamento Público nº 03/2026 — Premiação para Mestres e Mestras de Irecê), atendendo ao critério editalício de vedação de cumulatividade.',
    ),
    'Desclassificação do 1º Suplente (PNAB-2026-0060)',
  )

  desenharObservacao(
    doc,
    textoParaPdf(
      'Com a desclassificação do 1º suplente, o suplente subsequente na ordem classificatória — PNAB-2026-0091 (AME Capoeira, 2º suplente) — passa à condição de Classificado e fica oficialmente CONVOCADO para assumir a vaga remanescente.',
    ),
    'Convocação do Suplente Classificado (PNAB-2026-0091)',
  )

  // Aviso legal de encerramento
  garantirEspaco(doc, 40)
  doc.y += 10
  desenharAvisoLegal(
    doc,
    textoParaPdf(
      'Documento oficial de convocação de suplente da Secretaria Municipal de Cultura e Turismo de Irecê/BA, emitido e registrado no âmbito da Política Nacional Aldir Blanc (PNAB) — Lei Federal nº 14.399/2022.',
    ),
  )

  return finalizarDocumento(doc)
}
