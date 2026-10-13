import type { ContagemGrupo, RelatorioVisitas } from '@/lib/memorial/agendamento/relatorio'
import { formatarDiaCurto } from '@/lib/memorial/agendamento/datas'
import {
  agruparSituacao, numero, ordenarPorHorario, ROTULO_SITUACAO, textoVariacao, variacao, type GrupoSituacao,
} from '@/app/admin/memorial/agendamentos/relatorio/calculos'
import { desenharAvisoLegal, desenharBlocoInfo, desenharSecao } from './blocos'
import { desenharCabecalhoCompacto } from './cabecalho'
import { abrirDocumento, finalizarDocumento, garantirEspaco } from './pagina'
import { desenharBarraEmpilhada, desenharBarrasHorizontais, desenharColunas, type ItemGrafico } from './graficos-barras'
import { desenharTabela } from './tabela'
import { COLORS, LARGURA_UTIL, MARGINS } from './tema'

export interface DadosRelatorioVisitas {
  de: string
  ate: string
  atual: RelatorioVisitas
  anterior: RelatorioVisitas
  periodoAnterior: { de: string; ate: string }
  geradoEm?: Date
}

const TITULO = 'Relatório de visitas do Memorial'
const AVISO =
  'Relatório com dados agregados das solicitações de visita ao Memorial de Irecê. Não contém nome, contato ' +
  'ou qualquer outro dado pessoal dos visitantes. "Visitas na agenda" são as confirmadas e as já realizadas; ' +
  'o comparecimento compara as realizadas com as faltas.'

const COR_SITUACAO: Record<GrupoSituacao, string> = {
  realizadas: '#047857',
  confirmadas: '#0891b2',
  aguardando: '#d97706',
  faltaram: '#9d174d',
  canceladas: '#f9a8d4',
  recusadas: '#94a3b8',
}

const ESPACO_CARTAO = 8
const ALTURA_CARTAO = 62

interface Cartao {
  rotulo: string
  valor: number
  antes: number
  detalhe?: string
}

/** Quatro cartões lado a lado: o número, o que ele mede e a diferença para o período anterior. */
function desenharCartoes(doc: PDFKit.PDFDocument, cartoes: Cartao[]): void {
  const largura = (LARGURA_UTIL - ESPACO_CARTAO * (cartoes.length - 1)) / cartoes.length
  garantirEspaco(doc, ALTURA_CARTAO + 8)
  const y = doc.y + 2

  cartoes.forEach((c, i) => {
    const x = MARGINS.left + i * (largura + ESPACO_CARTAO)
    doc.rect(x, y, largura, ALTURA_CARTAO).fillAndStroke(COLORS.background, COLORS.border)
    doc.rect(x, y, 3, ALTURA_CARTAO).fill(COLORS.brand)
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(COLORS.textLight)
      .text(c.rotulo.toUpperCase(), x + 10, y + 7, { width: largura - 14, lineBreak: false })
    doc.font('Helvetica-Bold').fontSize(20).fillColor(COLORS.text)
      .text(numero(c.valor), x + 10, y + 19, { width: largura - 14, lineBreak: false })
    const apoio = [c.detalhe, textoVariacao(variacao(c.valor, c.antes), c.antes)].filter(Boolean).join('\n')
    doc.font('Helvetica').fontSize(7).fillColor(COLORS.textLight)
      .text(apoio, x + 10, y + 42, { width: largura - 14, height: 18 })
  })
  doc.y = y + ALTURA_CARTAO + 8
}

/** Comparecimento em barra: quem veio contra quem faltou, só entre as visitas já encerradas. */
function desenharComparecimento(doc: PDFKit.PDFDocument, r: RelatorioVisitas): void {
  const faltas = r.porStatus.NAO_COMPARECEU ?? 0
  const texto = r.taxaComparecimento === null
    ? 'Comparecimento: nenhuma visita encerrada neste período ainda.'
    : `Comparecimento: ${Math.round(r.taxaComparecimento * 100)}% (${numero(r.realizadas)} realizadas e ${numero(faltas)} faltas)`
  garantirEspaco(doc, 34)
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(COLORS.text).text(texto, MARGINS.left + 4, doc.y, { width: LARGURA_UTIL })
  desenharBarraEmpilhada(doc, [
    { valor: r.realizadas, cor: COR_SITUACAO.realizadas },
    { valor: faltas, cor: COR_SITUACAO.faltaram },
  ])
}

function itensRanking(grupos: ContagemGrupo[]): ItemGrafico[] {
  return [...grupos]
    .sort((a, b) => b.visitantes - a.visitantes || a.chave.localeCompare(b.chave))
    .map((g) => ({
      rotulo: g.chave,
      valor: g.visitantes,
      legenda: `${numero(g.visitantes)} pessoas · ${numero(g.visitas)} ${g.visitas === 1 ? 'visita' : 'visitas'}`,
    }))
}

/** Seção de ranking; sem visitas na agenda, escreve isso em vez de deixar a seção vazia. */
function desenharRanking(doc: PDFKit.PDFDocument, titulo: string, grupos: ContagemGrupo[], cor: string): void {
  garantirEspaco(doc, 60)
  desenharSecao(doc, titulo)
  if (grupos.length === 0) {
    doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(COLORS.textLight)
      .text('Nenhuma visita na agenda neste período.', MARGINS.left + 4, doc.y)
    return
  }
  desenharBarrasHorizontais(doc, itensRanking(grupos), cor)
}

function desenharSituacao(doc: PDFKit.PDFDocument, r: RelatorioVisitas): void {
  const grupos = agruparSituacao(r.porStatus).filter((g) => g.quantidade > 0)
  garantirEspaco(doc, 60)
  desenharSecao(doc, 'O que aconteceu com os pedidos')
  desenharBarraEmpilhada(doc, grupos.map((g) => ({ valor: g.quantidade, cor: COR_SITUACAO[g.grupo] })))
  desenharTabela(
    doc,
    [
      { label: 'Situação', width: LARGURA_UTIL - 160 },
      { label: '% dos pedidos', width: 90, align: 'right' },
      { label: 'Pedidos', width: 70, align: 'right', negrito: true },
    ],
    grupos.map((g) => ({
      valores: [ROTULO_SITUACAO[g.grupo], `${Math.round((g.quantidade / r.pedidos) * 100)}%`, numero(g.quantidade)],
      celulas: [{ cor: COR_SITUACAO[g.grupo], negrito: true }],
    })),
    { fios: true },
  )
}

/** PDF do relatório de visitas: os mesmos números e comparações da tela, só agregados. */
export async function gerarRelatorioVisitasMemorial(dados: DadosRelatorioVisitas): Promise<Buffer> {
  const { atual, anterior } = dados
  const doc = abrirDocumento({
    titulo: TITULO,
    geradoEm: dados.geradoEm,
    aoAbrirPagina: (folha) => desenharCabecalhoCompacto(folha, TITULO),
  })

  desenharBlocoInfo(doc, [
    { label: 'Unidade', value: 'Memorial de Irecê' },
    { label: 'Período', value: `${formatarDiaCurto(dados.de)} a ${formatarDiaCurto(dados.ate)}` },
    { label: 'Comparado com', value: `${formatarDiaCurto(dados.periodoAnterior.de)} a ${formatarDiaCurto(dados.periodoAnterior.ate)}` },
  ])

  desenharSecao(doc, 'Números do período')
  desenharCartoes(doc, [
    { rotulo: 'Pessoas na agenda', valor: atual.visitantes, antes: anterior.visitantes },
    { rotulo: 'Pedidos recebidos', valor: atual.pedidos, antes: anterior.pedidos },
    { rotulo: 'Visitas na agenda', valor: atual.visitas, antes: anterior.visitas },
    {
      rotulo: 'Visitas realizadas', valor: atual.realizadas, antes: anterior.realizadas,
      detalhe: `${numero(atual.visitantesRealizados)} pessoas atendidas`,
    },
  ])
  desenharComparecimento(doc, atual)

  garantirEspaco(doc, 130)
  desenharSecao(doc, 'Horários das visitas (visitas por horário de início)')
  if (atual.porHorario.length === 0) {
    doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(COLORS.textLight)
      .text('Nenhuma visita na agenda neste período.', MARGINS.left + 4, doc.y)
  } else {
    desenharColunas(
      doc,
      ordenarPorHorario(atual.porHorario).map((g) => ({ rotulo: g.chave, valor: g.visitas, legenda: numero(g.visitas) })),
      '#34d399', COLORS.brandDark,
    )
  }

  desenharSituacao(doc, atual)
  desenharRanking(doc, 'Por tipo de visitante', atual.porTipoVisitante, '#0891b2')
  desenharRanking(doc, 'Por faixa etária', atual.porFaixaEtaria, '#65a30d')

  garantirEspaco(doc, 32)
  desenharAvisoLegal(doc, AVISO)
  return finalizarDocumento(doc)
}
