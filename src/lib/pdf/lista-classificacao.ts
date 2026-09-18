import fs from 'fs'
import path from 'path'
import {
  createDocument, docToBuffer, addFooter,
  MARGINS, COLORS, CONTENT_WIDTH, PAGE_WIDTH, PAGE_HEIGHT,
} from './shared'

export interface LinhaClassificacao {
  posicao: number
  numero: string
  proponente: string
  notaBase: number
  notaBonus: number
  notaFinal: number
  cotista: boolean
  status: 'CONTEMPLADA' | 'SUPLENTE' | 'NAO_CONTEMPLADA'
  semAvaliacao: boolean
}

export interface CategoriaClassificacao {
  nome: string
  vagasAmplaConcorrencia: number | null
  cotas: { label: string; vagas: number }[]
  valorPorProjeto: number | null
  linhas: LinhaClassificacao[]
}

export interface ListaClassificacaoData {
  edital: { titulo: string; ano: number }
  categorias: CategoriaClassificacao[]
  /** Falso enquanto o resultado não foi consolidado — carimba a marca d'água. */
  consolidado: boolean
  mostraBonus: boolean
  geradoEm: Date
}

const SITUACAO: Record<LinhaClassificacao['status'], string> = {
  CONTEMPLADA: 'Contemplada',
  SUPLENTE: 'Suplente',
  NAO_CONTEMPLADA: 'Não contemplada',
}

const LINHA_ALTURA = 16
const RODAPE_SEGURO = PAGE_HEIGHT - MARGINS.bottom - 24

function brl(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function desenharTimbre(doc: PDFKit.PDFDocument, data: ListaClassificacaoData): void {
  doc.rect(0, 0, PAGE_WIDTH, 8).fill(COLORS.brand)
  const topo = MARGINS.top - 22

  let offset = 0
  try {
    const brasao = fs.readFileSync(path.join(process.cwd(), 'public/images/marca/brasao-irece.png'))
    doc.image(brasao, MARGINS.left, topo - 4, { width: 42, height: 42 })
    offset = 52
  } catch {
    offset = 0
  }

  try {
    const secult = fs.readFileSync(path.join(process.cwd(), 'public/images/secult/logo-secult-horizontal.png'))
    doc.image(secult, PAGE_WIDTH - MARGINS.right - 92, topo + 6, { width: 92 })
  } catch {
    // segue sem a logo da secretaria
  }

  doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.text)
    .text('PREFEITURA MUNICIPAL DE IRECÊ', MARGINS.left + offset, topo, { width: 300 })
  doc.font('Helvetica').fontSize(8).fillColor(COLORS.textLight)
    .text('Secretaria de Cultura e Turismo', MARGINS.left + offset, topo + 14, { width: 300 })
  doc.font('Helvetica-Bold').fontSize(13).fillColor(COLORS.text)
    .text(
      data.consolidado ? 'Classificação' : 'Classificação — Prévia de Trabalho',
      MARGINS.left + offset, topo + 26, { width: 300 },
    )

  doc.moveTo(MARGINS.left, MARGINS.top + 26).lineTo(PAGE_WIDTH - MARGINS.right, MARGINS.top + 26)
    .strokeColor(COLORS.brand).lineWidth(1.5).stroke()

  doc.y = MARGINS.top + 38
}

/** Marca d'água diagonal enquanto o resultado não foi consolidado. */
function desenharMarcaDagua(doc: PDFKit.PDFDocument): void {
  doc.save()
  doc.rotate(-24, { origin: [PAGE_WIDTH / 2, PAGE_HEIGHT / 2] })
  doc.font('Helvetica-Bold').fontSize(76).fillColor(COLORS.brand).opacity(0.07)
    .text('PRÉVIA', 0, PAGE_HEIGHT / 2 - 40, { width: PAGE_WIDTH, align: 'center' })
  doc.opacity(1).restore()
}

function novaPagina(doc: PDFKit.PDFDocument, data: ListaClassificacaoData, pagina: number): number {
  addFooter(doc, pagina)
  doc.addPage()
  if (!data.consolidado) desenharMarcaDagua(doc)
  desenharTimbre(doc, data)
  return pagina + 1
}

const COLUNAS_SEM_BONUS = [34, 86, 210, 0, 0, 58, 88] as const
const COLUNAS_COM_BONUS = [30, 82, 148, 52, 40, 56, 87] as const

function desenharCabecalhoTabela(doc: PDFKit.PDFDocument, cols: readonly number[], mostraBonus: boolean): void {
  const rotulos = mostraBonus
    ? ['Pos.', 'Inscrição', 'Proponente', 'Média', 'Bônus', 'Nota final', 'Situação']
    : ['Pos.', 'Inscrição', 'Proponente', '', '', 'Nota final', 'Situação']
  const topo = doc.y
  doc.rect(MARGINS.left, topo, CONTENT_WIDTH, 15).fill('#eef2f0')
  let x = MARGINS.left
  rotulos.forEach((rotulo, i) => {
    if (cols[i] === 0) return
    const alinhaDireita = i >= 3 && i <= 5
    doc.font('Helvetica-Bold').fontSize(6.5).fillColor(COLORS.textLight)
      .text(rotulo.toUpperCase(), x + 4, topo + 4.5, {
        width: cols[i] - 8,
        align: alinhaDireita ? 'right' : 'left',
        lineBreak: false,
      })
    x += cols[i]
  })
  doc.y = topo + 15
}

export async function generateListaClassificacao(data: ListaClassificacaoData): Promise<Buffer> {
  const doc = createDocument()
  let pagina = 1
  const cols = data.mostraBonus ? COLUNAS_COM_BONUS : COLUNAS_SEM_BONUS

  if (!data.consolidado) desenharMarcaDagua(doc)
  desenharTimbre(doc, data)

  doc.font('Helvetica').fontSize(8.5).fillColor(COLORS.text)
    .text(`${data.edital.titulo} (${data.edital.ano})`, MARGINS.left, doc.y, { width: CONTENT_WIDTH })
  doc.moveDown(0.3)

  if (!data.consolidado) {
    const alturaAviso = 30
    const topoAviso = doc.y
    doc.rect(MARGINS.left, topoAviso, CONTENT_WIDTH, alturaAviso).fillAndStroke('#fdf6e3', '#e0b657')
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#6b4a06')
      .text('DOCUMENTO DE TRABALHO — NÃO PUBLICAR.', MARGINS.left + 7, topoAviso + 6, { width: CONTENT_WIDTH - 14, continued: true })
      .font('Helvetica')
      .text(' A conferência da bonificação e o lançamento de notas podem estar em andamento, portanto esta classificação pode mudar. Nenhum resultado foi consolidado no sistema.')
    doc.y = topoAviso + alturaAviso + 8
  }

  for (const categoria of data.categorias) {
    if (doc.y + 60 > RODAPE_SEGURO) pagina = novaPagina(doc, data, pagina)

    const topoCat = doc.y
    doc.rect(MARGINS.left, topoCat, CONTENT_WIDTH, 17).fill(COLORS.brand)
    doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.white)
      .text(categoria.nome, MARGINS.left + 7, topoCat + 4.5, { width: CONTENT_WIDTH - 14, lineBreak: false })
    doc.y = topoCat + 17

    const cotas = categoria.cotas.filter((c) => c.vagas > 0).map((c) => `${c.label}: ${c.vagas}`).join(' · ')
    const partes = [
      `${categoria.vagasAmplaConcorrencia ?? '—'} vaga(s) de ampla concorrência`,
      cotas || 'sem cota reservada',
      categoria.valorPorProjeto ? `${brl(categoria.valorPorProjeto)} por projeto` : null,
    ].filter(Boolean)
    const topoMeta = doc.y
    doc.rect(MARGINS.left, topoMeta, CONTENT_WIDTH, 13).fillAndStroke('#f4f7f5', '#e3e8e5')
    doc.font('Helvetica').fontSize(6.5).fillColor(COLORS.textLight)
      .text(partes.join(' · '), MARGINS.left + 7, topoMeta + 4, { width: CONTENT_WIDTH - 14, lineBreak: false })
    doc.y = topoMeta + 13

    desenharCabecalhoTabela(doc, cols, data.mostraBonus)

    for (const linha of categoria.linhas) {
      if (doc.y + LINHA_ALTURA > RODAPE_SEGURO) {
        pagina = novaPagina(doc, data, pagina)
        desenharCabecalhoTabela(doc, cols, data.mostraBonus)
      }

      const topoLinha = doc.y
      if (linha.status === 'CONTEMPLADA') {
        doc.rect(MARGINS.left, topoLinha, CONTENT_WIDTH, LINHA_ALTURA).fill('#f6faf8')
      }

      const nome = linha.cotista ? `${linha.proponente}  (cotista)` : linha.proponente
      const celulas = [
        linha.semAvaliacao ? '—' : `${linha.posicao}º`,
        linha.numero,
        nome,
        data.mostraBonus ? linha.notaBase.toFixed(2) : '',
        data.mostraBonus ? (linha.notaBonus > 0 ? `+${linha.notaBonus.toFixed(0)}` : '—') : '',
        linha.semAvaliacao ? '—' : linha.notaFinal.toFixed(2),
        SITUACAO[linha.status],
      ]

      let x = MARGINS.left
      celulas.forEach((texto, i) => {
        if (cols[i] === 0) return
        const alinhaDireita = i >= 3 && i <= 5
        const negrito = i === 0 || i === 5
        doc.font(negrito ? 'Helvetica-Bold' : 'Helvetica').fontSize(7)
          .fillColor(i === 6 && linha.status === 'NAO_CONTEMPLADA' ? COLORS.textLight : COLORS.text)
          .text(texto, x + 4, topoLinha + 5, {
            width: cols[i] - 8,
            align: alinhaDireita ? 'right' : 'left',
            lineBreak: false,
            ellipsis: true,
          })
        x += cols[i]
      })

      doc.moveTo(MARGINS.left, topoLinha + LINHA_ALTURA).lineTo(PAGE_WIDTH - MARGINS.right, topoLinha + LINHA_ALTURA)
        .strokeColor('#edf0f2').lineWidth(0.5).stroke()
      doc.y = topoLinha + LINHA_ALTURA
    }

    doc.y += 10
  }

  addFooter(doc, pagina)
  return docToBuffer(doc)
}
