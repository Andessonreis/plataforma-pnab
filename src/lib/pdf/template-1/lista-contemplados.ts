import { abrirDocumento, finalizarDocumento, garantirEspaco } from './pagina'
import { desenharCabecalhoCompacto } from './cabecalho'
import { desenharBlocoInfo, desenharDivisor, desenharSecao, desenharAvisoLegal } from './blocos'
import { desenharTabela, type ColunaTabela } from './tabela'
import { maskCpfCnpj } from '@/lib/utils/mask'
import { dataHora } from '../documento-oficial/tema'

export interface ContempladoLista {
  categoria: string
  numero: string
  nome: string
  /** Documento sem máscara; a máscara é aplicada só na hora de imprimir. */
  cpfCnpj: string
}

export interface DadosListaContemplados {
  titulo: string
  editalTitulo: string
  ano: string
  contemplados: ContempladoLista[]
  /** Texto de fechamento com a base da consolidação (atos e convocações considerados). */
  avisoLegal: string
}

const ALTURA_MINIMA_CATEGORIA = 90

const COLUNAS: ColunaTabela[] = [
  { label: 'Nº', width: 28, align: 'center' },
  { label: 'INSCRIÇÃO', width: 82 },
  { label: 'NOME COMPLETO', width: 245.28 },
  { label: 'CPF / CNPJ', width: 140, align: 'center' },
]

/** Agrupa por categoria preservando a ordem alfabética, que é a da lista de entrada. */
function agruparPorCategoria(contemplados: ContempladoLista[]): Map<string, ContempladoLista[]> {
  const grupos = new Map<string, ContempladoLista[]>()
  for (const item of contemplados) {
    grupos.set(item.categoria, [...(grupos.get(item.categoria) ?? []), item])
  }
  return grupos
}

/** Relação de contemplados de um edital, uma seção por categoria, com documento mascarado (LGPD). */
export async function gerarListaContemplados(dados: DadosListaContemplados, agora = new Date()): Promise<Buffer> {
  let primeiraFolha = true
  const doc = abrirDocumento({
    titulo: `${dados.titulo} — ${dados.editalTitulo}`,
    geradoEm: agora,
    aoAbrirPagina: (folha) => {
      desenharCabecalhoCompacto(folha, primeiraFolha ? dados.titulo : `${dados.titulo} (continuação)`)
      primeiraFolha = false
    },
  })

  const grupos = agruparPorCategoria(dados.contemplados)

  desenharBlocoInfo(doc, [
    { label: 'Edital', value: dados.editalTitulo },
    { label: 'Ano', value: dados.ano },
    { label: 'Data de Emissão', value: dataHora(agora) },
    { label: 'Categorias', value: String(grupos.size) },
    { label: 'Total de Contemplados', value: String(dados.contemplados.length) },
  ])
  desenharDivisor(doc)

  for (const [categoria, itens] of grupos) {
    garantirEspaco(doc, ALTURA_MINIMA_CATEGORIA)
    desenharSecao(doc, `${categoria} — ${itens.length}`)
    desenharTabela(
      doc,
      COLUNAS,
      itens.map((item, indice) => ({
        valores: [String(indice + 1), item.numero, item.nome, maskCpfCnpj(item.cpfCnpj)],
      })),
      { fios: true },
    )
  }

  garantirEspaco(doc, 50)
  desenharAvisoLegal(doc, dados.avisoLegal)
  return finalizarDocumento(doc)
}

