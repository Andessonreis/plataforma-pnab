/**
 * Lista de agentes culturais cadastrados na plataforma, na versão 2 do layout
 * (padrão Diário Oficial).
 *
 * Documento interno de trabalho: leva contato (e-mail e telefone) pra Secretaria
 * falar com quem se cadastrou, então não é peça publicável. Aqui só se desenha;
 * colunas, valores e avisos vêm de `modelo/lista-agentes`, o mesmo conteúdo que
 * a versão 1 imprime.
 */
import {
  addInfoBlock,
  addDivider,
  addLegalNotice,
  addCompactSection,
} from './layout-helpers'
import {
  addTableHeader,
  addTableRows,
  addTableTotal,
  checkPageBreak,
} from './table-helpers'
import { criarDocumentoOficial, finalizarDocumento } from './documento-oficial'
import { montarListaAgentes } from './modelo/lista-agentes'
import type { ListaAgentesData } from './modelo/tipos'

export type { ListaAgentesData }

export async function generateListaAgentes(data: ListaAgentesData): Promise<Buffer> {
  const modelo = montarListaAgentes(data)
  const doc = await criarDocumentoOficial({
    rotulo: modelo.rotulo,
    titulo: modelo.titulo,
    emissao: data.emissao ?? null,
    aviso: modelo.avisoAbertura,
  })

  addInfoBlock(doc, modelo.ficha)
  addDivider(doc)

  addCompactSection(doc, modelo.tituloSecao)
  addTableHeader(doc, modelo.colunas)
  addTableRows(doc, modelo.colunas, modelo.linhas, modelo.semRegistros)
  addTableTotal(doc, modelo.textoTotal)

  checkPageBreak(doc, 60)
  addLegalNotice(doc, modelo.avisoLegal)

  return finalizarDocumento(doc, modelo.protocolo)
}
