/**
 * Conteúdo da relação de inscrições, pronto para desenhar.
 *
 * A lista sai em três recortes — agrupada por área, restrita a uma área ou
 * contínua com a categoria em coluna — e as duas versões de layout escrevem
 * exatamente o mesmo texto neles. Tudo o que não é desenho fica aqui: título,
 * ficha de dados, colunas, valores das linhas, agrupamento, aviso legal e itens
 * do protocolo. Sem PDFKit.
 */
import {
  identificacaoEdital, rotuloDoCromo, subtituloEdital, tituloDocumento,
} from '@/lib/documentos/titulos'
import type { ItemProtocolo } from '@/lib/pdf/documento-oficial/protocolo'
import type { LinhaFicha } from '@/lib/pdf/layout-helpers'
import type { ColumnDef } from '@/lib/pdf/table-helpers'
import { buildRowValues, getColumns, STATUS_COM_TELEFONE } from './lista-inscricoes-colunas'
import type { ListaInscricoesData, ListaInscricoesItem } from './tipos'

/** Grupo em que cai a inscrição sem categoria, para ela não sumir da lista agrupada. */
export const AREA_SEM_CATEGORIA = 'Sem categoria definida'

export interface GrupoArea {
  area: string
  itens: ListaInscricoesItem[]
}

export interface TotalPorArea {
  area: string
  total: number
}

/** Quadro que compara as áreas, impresso antes das tabelas da lista agrupada. */
export interface ResumoPorArea {
  titulo: string
  areas: TotalPorArea[]
}

/** Uma tabela do documento: título da faixa e os valores de cada linha. */
export interface SecaoLista {
  titulo: string
  /** Valores na ordem de `colunas`, já formatados e com o CPF/CNPJ mascarado. */
  linhas: string[][]
}

export interface ListaInscricoesModelo {
  /** Rótulo curto impresso no cromo de toda página. */
  rotulo: string
  titulo: string
  subtitulo: string
  /** Ficha de dados que abre o documento. */
  ficha: LinhaFicha[]
  colunas: ColumnDef[]
  /** Verdadeiro na lista agrupada: uma seção por área, em ordem alfabética. */
  agrupada: boolean
  /** Nulo quando não há o que comparar: lista não agrupada ou com uma área só. */
  resumoPorArea: ResumoPorArea | null
  /** Uma seção por área na lista agrupada; nos demais recortes, uma só. */
  secoes: SecaoLista[]
  textoTotal: string
  avisoLegal: string
  protocolo: ItemProtocolo[]
}

/**
 * Agrupa por área em ordem alfabética. O `sort()` sem comparador ordena por
 * unidade de código, que é como a lista agrupada sempre saiu impressa.
 */
export function agruparPorArea(itens: ListaInscricoesItem[]): GrupoArea[] {
  const porArea = new Map<string, ListaInscricoesItem[]>()
  for (const item of itens) {
    const area = item.categoria || AREA_SEM_CATEGORIA
    const grupo = porArea.get(area)
    if (grupo) grupo.push(item)
    else porArea.set(area, [item])
  }
  return Array.from(porArea.keys()).sort().map((area) => ({ area, itens: porArea.get(area) ?? [] }))
}

function resumoDasAreas(grupos: GrupoArea[]): ResumoPorArea {
  return {
    titulo: 'Distribuição por área / categoria',
    areas: grupos.map(({ area, itens }) => ({ area, total: itens.length })),
  }
}

/**
 * Aviso ao pé da lista. Rascunho não é lista oficial nem publicável: são
 * inscrições inacabadas, e o documento leva telefone pra equipe entrar em contato.
 */
export function avisoLegal(status: string): string {
  if (STATUS_COM_TELEFONE.has(status)) {
    return 'Documento interno de trabalho gerado pela plataforma Portal PNAB Irecê. '
      + 'Relaciona inscrições iniciadas e ainda não enviadas na data de geração, com telefone '
      + 'para contato da equipe da Secretaria. Não constitui lista oficial e não deve ser '
      + 'publicado nem compartilhado fora da Secretaria — contém dados pessoais protegidos pela LGPD.'
  }
  return 'Este documento é uma lista oficial gerada pela plataforma Portal PNAB Irecê. '
    + 'Os dados apresentados correspondem às informações registradas no sistema na data de geração. '
    + 'Para contestações e recursos, consulte os prazos estabelecidos no edital.'
}

/**
 * Valores das linhas de uma seção. Com a categoria fora da tabela (agrupada ou
 * restrita a uma área) a numeração recomeça em 1 dentro da seção.
 */
function linhasDaSecao(
  itens: ListaInscricoesItem[],
  status: string,
  ocultarCategoria: boolean,
): string[][] {
  return itens.map((item, i) =>
    buildRowValues(ocultarCategoria ? { ...item, posicao: i + 1 } : item, status, ocultarCategoria),
  )
}

/** Ficha de dados; `totalNaLista` já vem redigido, porque a lista agrupada acrescenta as áreas. */
function fichaDaLista(data: ListaInscricoesData, totalNaLista: string): LinhaFicha[] {
  return [
    { label: 'Edital', value: data.edital.titulo },
    ...(data.categoria ? [{ label: 'Área / categoria', value: data.categoria }] : []),
    { label: 'Ano', value: String(data.edital.ano) },
    { label: 'Situação das inscrições', value: data.statusLabel },
    { label: 'Total na lista', value: totalNaLista },
  ]
}

function protocoloDaLista(titulo: string, data: ListaInscricoesData): ItemProtocolo[] {
  return [
    { rotulo: 'Documento', valor: titulo },
    { rotulo: 'Edital', valor: identificacaoEdital(data.edital) },
    { rotulo: 'Situação das inscrições', valor: data.statusLabel },
    { rotulo: 'Categoria', valor: data.categoria ?? 'Todas' },
    { rotulo: 'Inscrições', valor: String(data.total) },
  ]
}

/**
 * Monta o conteúdo da relação. O recorte segue esta precedência: agrupada
 * vence restrita a uma área, que vence a lista contínua.
 */
export function montarListaInscricoes(data: ListaInscricoesData): ListaInscricoesModelo {
  const agrupada = Boolean(data.agruparPorCategoria)
  const porArea = Boolean(data.categoria)
  const ocultarCategoria = agrupada || porArea
  const grupos = agrupada ? agruparPorArea(data.inscricoes) : []
  const contagem = `${data.total} inscrição(ões)`

  const titulo = tituloDocumento({
    tipo: 'LISTA_INSCRICOES',
    edital: data.edital,
    status: data.status,
    statusLabel: data.statusLabel,
    tituloDocumento: data.tituloDocumento,
  })

  const secoes: SecaoLista[] = agrupada
    ? grupos.map(({ area, itens }) => ({
      titulo: `${area} (${itens.length})`,
      linhas: linhasDaSecao(itens, data.status, true),
    }))
    : [{
      titulo: porArea ? `Inscrições — ${data.categoria}` : 'Inscrições',
      linhas: linhasDaSecao(data.inscricoes, data.status, ocultarCategoria),
    }]

  return {
    rotulo: rotuloDoCromo('LISTA_INSCRICOES'),
    titulo,
    subtitulo: subtituloEdital(data.edital),
    ficha: fichaDaLista(data, agrupada ? `${contagem} em ${grupos.length} área(s)` : contagem),
    colunas: getColumns(data.status, ocultarCategoria),
    agrupada,
    resumoPorArea: grupos.length > 1 ? resumoDasAreas(grupos) : null,
    secoes,
    textoTotal: agrupada ? `Total geral do edital: ${contagem}` : `Total: ${contagem}`,
    avisoLegal: avisoLegal(data.status),
    protocolo: protocoloDaLista(titulo, data),
  }
}
