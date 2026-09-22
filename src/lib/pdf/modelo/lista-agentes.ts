/**
 * Conteúdo da lista de agentes culturais, pronto para desenhar.
 *
 * Documento interno de trabalho: leva contato (e-mail e telefone) pra Secretaria
 * falar com quem se cadastrou, então não é peça publicável. As colunas vêm da
 * seleção feita na exportação — a largura se reparte entre as que foram pedidas.
 * Sem PDFKit: as duas versões de layout escrevem o mesmo texto.
 */
import {
  DEFINICOES_CAMPO, labelDoCampo, valorDoCampo, type CampoAgente,
} from '@/lib/agentes/campos'
import { rotuloDoCromo, tituloDocumento } from '@/lib/documentos/titulos'
import { LARGURA_UTIL } from '@/lib/pdf/documento-oficial/tema'
import type { ItemProtocolo } from '@/lib/pdf/documento-oficial/protocolo'
import type { LinhaFicha } from '@/lib/pdf/layout-helpers'
import type { ColumnDef } from '@/lib/pdf/table-helpers'
import type { ListaAgentesData } from './tipos'

export interface ListaAgentesModelo {
  /** Rótulo curto impresso no cromo de toda página. */
  rotulo: string
  titulo: string
  /** Tarja de alerta da abertura: o documento tem dado pessoal e não circula fora da Secretaria. */
  avisoAbertura: string
  /** Ficha de dados que abre o documento: filtros aplicados e total. */
  ficha: LinhaFicha[]
  tituloSecao: string
  colunas: ColumnDef[]
  /** Valores na ordem de `colunas`, com o CPF/CNPJ mascarado. */
  linhas: string[][]
  /** Texto da linha única exibida quando nenhum cadastro passa pelos filtros. */
  semRegistros: string
  textoTotal: string
  avisoLegal: string
  protocolo: ItemProtocolo[]
}

const COLUNA_ORDEM: ColumnDef = { label: 'Nº', width: 24 }

/**
 * Distribui a largura útil entre as colunas escolhidas, proporcional ao peso
 * de cada campo. A sobra da divisão vai pra última coluna, pra tabela fechar
 * exatamente na largura da página.
 */
export function montarColunas(campos: CampoAgente[]): ColumnDef[] {
  const disponivel = LARGURA_UTIL - COLUNA_ORDEM.width
  const somaPesos = campos.reduce((acc, campo) => acc + DEFINICOES_CAMPO[campo].peso, 0)

  const colunas = campos.map((campo) => ({
    label: labelDoCampo(campo),
    width: Math.floor((DEFINICOES_CAMPO[campo].peso / somaPesos) * disponivel),
  }))

  const usado = colunas.reduce((acc, c) => acc + c.width, 0)
  if (colunas.length > 0) {
    colunas[colunas.length - 1].width += disponivel - usado
  }

  return [{ ...COLUNA_ORDEM }, ...colunas]
}

/** Monta o conteúdo da lista a partir dos filtros, dos campos pedidos e dos agentes. */
export function montarListaAgentes(data: ListaAgentesData): ListaAgentesModelo {
  const titulo = tituloDocumento({ tipo: 'LISTA_AGENTES', titulo: data.titulo })
  const total = data.agentes.length

  return {
    rotulo: rotuloDoCromo('LISTA_AGENTES'),
    titulo,
    avisoAbertura: 'Documento interno de trabalho. Relaciona dados de contato dos agentes cadastrados, '
      + 'protegidos pela LGPD — não deve ser publicado nem compartilhado fora da Secretaria.',
    ficha: [...data.filtros, { label: 'Total de cadastros', value: String(total) }],
    tituloSecao: 'Cadastros',
    colunas: montarColunas(data.campos),
    linhas: data.agentes.map((agente, i) => [
      String(i + 1),
      ...data.campos.map((campo) => valorDoCampo(agente, campo, { mascararDocumento: true })),
    ]),
    semRegistros: 'Nenhum cadastro encontrado para os filtros aplicados.',
    textoTotal: `Total: ${total} cadastro(s)`,
    avisoLegal: 'Documento interno de trabalho gerado pela plataforma Portal PNAB Irecê. '
      + 'Relaciona os cadastros existentes no sistema na data de geração, com dados de contato '
      + 'para uso da equipe da Secretaria. Contém dados pessoais protegidos pela LGPD: não deve '
      + 'ser publicado nem compartilhado fora da Secretaria.',
    protocolo: [
      { rotulo: 'Documento', valor: titulo },
      { rotulo: 'Registros', valor: String(total) },
      { rotulo: 'Uso', valor: 'Interno — contém dados pessoais' },
    ],
  }
}
