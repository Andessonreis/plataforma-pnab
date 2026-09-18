/**
 * Colunas e valores da relação de inscrições.
 *
 * O recorte muda com o status: lista de resultado leva nota e posição, lista de
 * inabilitados leva o motivo, e a de rascunhos leva telefone — é documento
 * interno de contato, a Secretaria usa pra ligar pra quem não concluiu.
 */
import { formatTelefoneBR } from '@/lib/utils/format'
import { maskCpfCnpjParcial } from '@/lib/utils/mask'
import { LARGURA_UTIL } from '../documento-oficial/tema'
import type { ColumnDef } from '../table-helpers'

export interface ListaInscricoesItem {
  posicao: number
  numero: string
  nome: string
  cpfCnpj: string
  categoria: string | null
  telefone: string | null
  notaFinal: number | null
  motivoInabilitacao: string | null
}

/** Status que exibem nota final e posição de classificação. */
export const STATUS_COM_NOTA = new Set(['CONTEMPLADA', 'NAO_CONTEMPLADA', 'SUPLENTE'])

/** Status que exibe motivo de inabilitação. */
export const STATUS_COM_MOTIVO = new Set(['INABILITADA'])

/** Só a lista de rascunhos leva contato; as demais são publicáveis. */
export const STATUS_COM_TELEFONE = new Set(['RASCUNHO'])

/** Distribui a sobra da largura útil na coluna informada. */
function ajustar(colunas: ColumnDef[], indice: number): ColumnDef[] {
  const usado = colunas.reduce((soma, coluna) => soma + coluna.width, 0)
  colunas[indice].width += LARGURA_UTIL - usado
  return colunas
}

/** Colunas da lista quando a categoria já está no título da seção. */
function semCategoria(status: string): ColumnDef[] {
  const base: ColumnDef[] = [
    { label: 'Nº', width: 28, align: 'center' },
    { label: 'Protocolo', width: 80 },
    { label: 'Nome', width: 220 },
    { label: 'CPF/CNPJ', width: 85, align: 'center' },
  ]

  if (STATUS_COM_NOTA.has(status)) {
    return ajustar([...base, { label: 'Nota', width: 47, align: 'right' },
      { label: 'Pos.', width: 40, align: 'center' }], 2)
  }
  if (STATUS_COM_MOTIVO.has(status)) {
    return ajustar([...base, { label: 'Motivo', width: 127 }], 2)
  }
  if (STATUS_COM_TELEFONE.has(status)) {
    return ajustar([...base, { label: 'Telefone', width: 92 }], 2)
  }
  return ajustar(base, 2)
}

/** Colunas da lista contínua, com a categoria como coluna própria. */
function comCategoria(status: string): ColumnDef[] {
  const base: ColumnDef[] = [
    { label: 'Nº', width: 24, align: 'center' },
    { label: 'Protocolo', width: 74 },
    { label: 'Nome', width: 150 },
    { label: 'CPF/CNPJ', width: 68, align: 'center' },
    { label: 'Categoria', width: 80 },
  ]

  if (STATUS_COM_NOTA.has(status)) {
    return ajustar([...base, { label: 'Nota', width: 42, align: 'right' },
      { label: 'Pos.', width: 36, align: 'center' }], 4)
  }
  if (STATUS_COM_MOTIVO.has(status)) {
    return ajustar([...base, { label: 'Motivo', width: 110 }], 4)
  }
  if (STATUS_COM_TELEFONE.has(status)) {
    return ajustar([...base, { label: 'Telefone', width: 74 }], 4)
  }
  return ajustar(base, 4)
}

export function getColumns(status: string, ocultarCategoria = false): ColumnDef[] {
  return ocultarCategoria ? semCategoria(status) : comCategoria(status)
}

/** Monta os valores de uma linha de acordo com o status. */
export function buildRowValues(
  item: ListaInscricoesItem,
  status: string,
  ocultarCategoria = false,
): string[] {
  const base = [String(item.posicao), item.numero, item.nome, maskCpfCnpjParcial(item.cpfCnpj)]
  if (!ocultarCategoria) base.push(item.categoria ?? '—')

  if (STATUS_COM_NOTA.has(status)) {
    return [...base, item.notaFinal !== null ? Number(item.notaFinal).toFixed(2) : '—', String(item.posicao)]
  }
  if (STATUS_COM_MOTIVO.has(status)) {
    return [...base, item.motivoInabilitacao ?? '—']
  }
  if (STATUS_COM_TELEFONE.has(status)) {
    return [...base, formatTelefoneBR(item.telefone ?? '') || '—']
  }
  return base
}
