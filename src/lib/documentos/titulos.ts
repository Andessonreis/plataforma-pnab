/**
 * Nomes dos documentos oficiais — fonte única.
 *
 * `NOME_DO_TIPO` cobre todo tipo que já foi emitido, inclusive os que não se
 * nomeiam por aqui (comprovante, dossiê, resultado), porque a página de
 * verificação precisa rotular registro antigo.
 *
 * O mesmo documento aparecia com nomes diferentes em cada lugar: a lista de
 * habilitados saía como "Relação Definitiva de Habilitados" no papel e como
 * "Habilitada — {edital} ({ano})" na página de verificação; o relatório final
 * tinha três nomes (papel, protocolo e verificação); o extrato de recursos
 * levava a etapa só no título. Tudo isso passa por aqui: título impresso,
 * rótulo do cromo, título gravado na emissão, linha "Documento" do protocolo e
 * o subtítulo do edital.
 *
 * Módulo folha: só texto e função pura, sem Prisma, sem PDFKit e sem nada de
 * servidor — as duas versões de layout, as rotas e a tela de verificação
 * importam daqui.
 */

/** Tipos de documento que o portal emite. O valor é o nome exibido na verificação. */
export const NOME_DO_TIPO = {
  CLASSIFICACAO: 'Classificação por categoria',
  LISTA_INSCRICOES: 'Lista de inscrições',
  LISTA_AGENTES: 'Relação de agentes culturais',
  LISTA_RESULTADO: 'Resultado do edital',
  RELATORIO_FINAL: 'Relatório final do edital',
  RELATORIO_RECURSOS: 'Relatório de recursos interpostos',
  DOSSIE_INSCRICAO: 'Dossiê da inscrição',
  PROJETO_COMPLETO: 'Projeto completo',
  COMPROVANTE_INSCRICAO: 'Comprovante de inscrição',
  DECLARACAO: 'Declaração',
} as const

export type TipoDocumento = keyof typeof NOME_DO_TIPO

export interface EditalTitulo {
  titulo: string
  ano: number
}

/** Prévia de trabalho, resultado consolidado no sistema ou resultado final depois dos recursos. */
export type SituacaoClassificacao = 'PREVIA' | 'CONSOLIDADA' | 'FINAL'

/** Documentos cujo nome é montado aqui — listas e relatórios do edital. */
export type TipoTitulavel =
  | 'LISTA_INSCRICOES'
  | 'LISTA_AGENTES'
  | 'CLASSIFICACAO'
  | 'RELATORIO_FINAL'
  | 'RELATORIO_RECURSOS'

/** Dados mínimos de cada tipo para se nomear. */
export type EntradaTitulo =
  | {
      tipo: 'LISTA_INSCRICOES'
      edital: EditalTitulo
      status: string
      statusLabel: string
      /** Título fixado por quem gerou (ex.: relação preliminar); tem precedência. */
      tituloDocumento?: string | null
    }
  | { tipo: 'LISTA_AGENTES'; titulo?: string | null }
  | { tipo: 'CLASSIFICACAO'; edital: EditalTitulo; situacao: SituacaoClassificacao }
  | { tipo: 'RELATORIO_FINAL'; edital: EditalTitulo }
  | { tipo: 'RELATORIO_RECURSOS'; edital: EditalTitulo; etapa: string }

/** Rótulo curto impresso no cromo de toda página. */
export const ROTULO_DO_CROMO: Record<TipoTitulavel, string> = {
  LISTA_INSCRICOES: 'Inscrições',
  LISTA_AGENTES: 'Agentes culturais',
  CLASSIFICACAO: 'Classificação',
  RELATORIO_FINAL: 'Relatório final',
  RELATORIO_RECURSOS: 'Recursos',
}

const TITULO_CLASSIFICACAO: Record<SituacaoClassificacao, string> = {
  PREVIA: 'Classificação — Prévia de Trabalho',
  CONSOLIDADA: 'Classificação por Categoria',
  FINAL: 'Relação de Contemplados',
}

/** Título da lista de inscrições: o status manda, salvo título fixado na geração. */
function tituloDaLista(status: string, statusLabel: string, fixado?: string | null): string {
  if (fixado) return fixado
  if (status === 'ENVIADA') return 'Relação de Inscritos'
  if (status === 'HABILITADA') return 'Relação Definitiva de Habilitados'
  if (status === 'RASCUNHO') return 'Relação de Inscrições em Rascunho'
  return `Relação de Inscrições — ${statusLabel}`
}

/**
 * Título impresso na abertura, gravado em `Info.Title` do PDF e repetido na
 * linha "Documento" do protocolo — ter dois nomes para a mesma peça obrigava
 * quem conferia o papel a adivinhar se estava olhando o documento certo.
 */
export function tituloDocumento(entrada: EntradaTitulo): string {
  switch (entrada.tipo) {
    case 'LISTA_INSCRICOES':
      return tituloDaLista(entrada.status, entrada.statusLabel, entrada.tituloDocumento)
    case 'LISTA_AGENTES':
      return entrada.titulo || 'Agentes Culturais Cadastrados'
    case 'CLASSIFICACAO':
      return TITULO_CLASSIFICACAO[entrada.situacao]
    case 'RELATORIO_FINAL':
      return 'Relatório Final de Resultado'
    case 'RELATORIO_RECURSOS':
      return `Relatório de Recursos Interpostos - ${entrada.etapa}`
  }
}

/** Rótulo do cromo do documento. */
export function rotuloDoCromo(tipo: TipoTitulavel): string {
  return ROTULO_DO_CROMO[tipo]
}

/** "{edital} · {ano}" — subtítulo sob o título, na abertura. */
export function subtituloEdital(edital: EditalTitulo): string {
  return `${edital.titulo} · ${edital.ano}`
}

/** "{edital} ({ano})" — identificação do edital no protocolo e no registro. */
export function identificacaoEdital(edital: EditalTitulo): string {
  return `${edital.titulo} (${edital.ano})`
}

/**
 * Título gravado em `DocumentoEmitido.titulo` e exibido na página pública de
 * verificação. Leva a identificação do edital porque ali o documento aparece
 * sozinho, sem o papel ao lado.
 */
export function tituloRegistro(entrada: EntradaTitulo): string {
  const titulo = tituloDocumento(entrada)
  if (entrada.tipo === 'LISTA_AGENTES') return titulo
  return `${titulo} — ${identificacaoEdital(entrada.edital)}`
}
