import fs from 'fs'
import path from 'path'
import { abrirDocumento, finalizarDocumento, garantirEspaco } from '../src/lib/pdf/template-1/pagina'
import { desenharCabecalhoCompacto } from '../src/lib/pdf/template-1/cabecalho'
import { desenharBlocoInfo, desenharDivisor, desenharAvisoLegal } from '../src/lib/pdf/template-1/blocos'
import { desenharTabela, type ColunaTabela, type LinhaTabela, type EstiloCelula } from '../src/lib/pdf/template-1/tabela'
import { COLORS, LARGURA_UTIL, MARGINS } from '../src/lib/pdf/template-1/tema'
import { maskCpfCnpj } from '../src/lib/utils/mask'

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
  doc.rect(MARGINS.left, y, LARGURA_UTIL, ALTURA_QUADRO).fillAndStroke(COLORS.destaque, COLORS.destaqueBorda)
  doc.font('Helvetica-Bold').fontSize(6.8).fillColor(COLORS.sucesso)
    .text(info, MARGINS.left + 7, y + 3.4, { width: LARGURA_UTIL - 14, lineBreak: false })
  doc.y = y + ALTURA_QUADRO
}

function desenharObservacao(doc: PDFKit.PDFDocument, texto: string): void {
  const RECUO = 8
  const largura = LARGURA_UTIL - RECUO * 2
  doc.font('Helvetica-Oblique').fontSize(7.5)
  const altura = doc.heightOfString(`Observação: ${texto}`, { width: largura }) + 10
  garantirEspaco(doc, altura + 4)
  const y = doc.y + 6
  doc.rect(MARGINS.left, y, LARGURA_UTIL, altura).fill(COLORS.background)
  doc.fillColor(COLORS.text).font('Helvetica-Bold').text('Observação: ', MARGINS.left + RECUO, y + 5, { continued: true, width: largura })
    .font('Helvetica-Oblique').text(texto)
  doc.y = y + altura
}

// Dados oficiais do banco de dados de produção (VPS) do Edital Premiação para Mestres e Mestras de Irecê
const PROPOSTAS = [
  {
    posicao: 1,
    numero: 'PNAB-2026-0103',
    nome: 'Elisangela Santana de Jesus',
    cpfCnpj: '08121803560',
    notaFinal: '29.17',
    status: 'CONTEMPLADA' as const,
  },
  {
    posicao: 2,
    numero: 'PNAB-2026-0141',
    nome: 'Maria Soares dos Santos',
    cpfCnpj: '63734486572',
    notaFinal: '28.00',
    status: 'CONTEMPLADA' as const,
  },
  {
    posicao: 3,
    numero: 'PNAB-2026-0053',
    nome: 'José Adenildo de Oliveira',
    cpfCnpj: '29510198587',
    notaFinal: '27.00',
    status: 'CONTEMPLADA' as const,
  },
  {
    posicao: 4,
    numero: 'PNAB-2026-0146',
    nome: 'Adolfo Edson Alves Dourado',
    cpfCnpj: '16594487515',
    notaFinal: '25.67',
    status: 'SUPLENTE' as const,
  },
  {
    posicao: 5,
    numero: 'PNAB-2026-0130',
    nome: 'Silvano Jose dos Santos',
    cpfCnpj: '29331650582',
    notaFinal: '24.33',
    status: 'CONTEMPLADA' as const,
  },
  {
    posicao: 6,
    numero: 'PNAB-2026-0089',
    nome: 'Paulo Atto Batista dos Santos',
    cpfCnpj: '19490607568',
    notaFinal: '19.33',
    status: 'CONTEMPLADA' as const,
  },
  {
    posicao: 7,
    numero: 'PNAB-2026-0131',
    nome: 'Jackson Rubem Alves dos Santos',
    cpfCnpj: '09122273549',
    notaFinal: '18.33',
    status: 'SUPLENTE' as const,
  },
  {
    posicao: 8,
    numero: 'PNAB-2026-0165',
    nome: 'Adelio Dourado',
    cpfCnpj: '09124209520',
    notaFinal: '17.50',
    status: 'SUPLENTE' as const,
  },
  {
    posicao: 9,
    numero: 'PNAB-2026-0138',
    nome: 'Idalina de Sousa Vieira',
    cpfCnpj: '48814059500',
    notaFinal: '17.00',
    status: 'SUPLENTE' as const,
  },
  {
    posicao: 10,
    numero: 'PNAB-2026-0118',
    nome: 'Jário Florêncio Bastos',
    cpfCnpj: '65702948815',
    notaFinal: '15.83',
    status: 'SUPLENTE' as const,
  },
]

export async function gerarPdfResultadoFinalMestres(agora: Date = new Date()): Promise<Buffer> {
  const titulo = 'Relação de Contemplados'
  const editalTitulo = 'Premiação para Mestres e Mestras de Irecê'
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

  // Bloco de Identificação no padrão do template de contemplados
  desenharBlocoInfo(doc, [
    { label: 'Edital', value: editalTitulo },
    { label: 'Ano', value: ano },
    { label: 'Contemplados', value: '5' },
    { label: 'Suplentes', value: '5' },
  ])
  desenharDivisor(doc)

  const categoriaNome = 'Mestres e Mestras das Culturas Tradicionais e Populares'
  const categoriaQuadro = '3 vaga(s) de ampla concorrência · Cotas Pessoas Negras: 1 · Cotas Indígenas e/ou PCD: 1 · R$ 10.000,00 por projeto'

  garantirEspaco(doc, ALTURA_TARJA + ALTURA_QUADRO + 250)
  desenharTarja(doc, categoriaNome)
  desenharQuadroInfo(doc, categoriaQuadro)

  const colunas: ColunaTabela[] = [
    { label: 'POS.', width: 28, align: 'center' },
    { label: 'INSCRIÇÃO', width: 80 },
    { label: 'PROPONENTE', width: 187.28 },
    { label: 'CPF', width: 76, align: 'center' },
    { label: 'NOTA FINAL', width: 56, align: 'right' },
    { label: 'SITUAÇÃO', width: 68, align: 'center' },
  ]

  const linhas: LinhaTabela[] = PROPOSTAS.map((prop) => {
    const contemplada = prop.status === 'CONTEMPLADA'
    const celulas: (EstiloCelula | undefined)[] = [
      contemplada ? { cor: COLORS.sucesso, negrito: true } : undefined,
      contemplada ? { negrito: true } : undefined,
      contemplada ? { negrito: true, sublinhado: true } : undefined,
      undefined,
      contemplada ? { cor: COLORS.sucesso, negrito: true } : undefined,
      contemplada ? { cor: COLORS.sucesso, negrito: true } : undefined,
    ]

    return {
      valores: [
        `${prop.posicao}º`,
        prop.numero,
        prop.nome,
        maskCpfCnpj(prop.cpfCnpj),
        prop.notaFinal,
        contemplada ? 'Contemplado' : 'Suplente',
      ],
      celulas,
      destaque: contemplada ? COLORS.destaque : undefined,
    }
  })

  desenharTabela(doc, colunas, linhas, { fios: true })
  doc.y += 6

  // Observação sobre a cota remanejada conforme o edital (itens 6.7 e 6.7.1)
  desenharObservacao(
    doc,
    'Não houve proposta apta optante da cota Indígenas e/ou PCD. Como prevê o edital (itens 6.7 e 6.7.1), a vaga foi destinada à cota Pessoas Negras.',
  )

  // Aviso legal de encerramento dos recursos
  garantirEspaco(doc, 45)
  doc.y += 10
  desenharAvisoLegal(
    doc,
    'Relação de contemplados e suplentes consolidada no sistema da plataforma Portal PNAB Irecê, após o julgamento dos recursos, conforme as notas lançadas pela comissão avaliadora.',
  )

  return finalizarDocumento(doc)
}

async function main() {
  console.log('Gerando PDF da Relação Final de Classificados - Mestres e Mestras...')
  const buffer = await gerarPdfResultadoFinalMestres()

  const filenames = [
    'resultado-final-classificacao_mestres-e-mestras-de-irece_2026-10-01.pdf',
    'relacao-final-classificados_mestres-e-mestras-de-irece_2026-10-01.pdf',
    'relacao-contemplados_mestres-e-mestras-de-irece_2026-10-01.pdf',
  ]

  const destinations = [
    '/home/andesson-reis/Documents',
    '/home/andesson-reis/Downloads',
    path.resolve('.omc/artifacts'),
    path.resolve('public/documentos'),
  ]

  for (const dir of destinations) {
    if (fs.existsSync(dir)) {
      for (const fname of filenames) {
        const outPath = path.join(dir, fname)
        fs.writeFileSync(outPath, buffer)
        console.log(`Salvo em: ${outPath} (${buffer.length} bytes)`)
      }
    }
  }
}

if (process.argv[1]?.endsWith('gerar-pdf-resultado-final-mestres.ts')) {
  main().catch(console.error)
}
