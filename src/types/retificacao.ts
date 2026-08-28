/**
 * Retificação de edital — o ato administrativo que altera um edital já
 * publicado (prorrogação de prazo, correção de data, mudança de regra).
 *
 * A retificação só existe juridicamente depois de publicada no Diário
 * Oficial: por isso `publicadoEm` e `diarioOficialUrl` são o núcleo do
 * registro, e nada aparece ao público enquanto o edital não tiver ao
 * menos uma retificação gravada.
 *
 * O que é guardado aqui é o *cabeçalho* do ato. A marca de qual data
 * mudou vive no próprio item do cronograma (`retificado`), para que a
 * página consiga riscar a data antiga ao lado da nova sem precisar
 * cruzar as duas estruturas na renderização.
 */
export interface Retificacao {
  /** Número do ato como saiu no Diário Oficial — ex.: "01", "02". */
  numero: string
  /** Data da publicação no Diário Oficial (ISO, sem timezone). */
  publicadoEm: string
  /** Texto exibido na faixa vermelha, na linguagem da Secretaria. */
  resumo: string
  /** Link para o Diário Oficial, quando houver edição online. */
  diarioOficialUrl?: string
  /** Quando o registro foi gravado no sistema (ISO, auditoria). */
  registradoEm: string
}

/**
 * Marca deixada num item do cronograma alterado por uma retificação.
 *
 * Guarda a data **imediatamente anterior** ao ato — não a data original
 * de quando o edital nasceu. É o que a página risca ao lado da data nova
 * ("de 27/08 para 02/09"), é como a retificação se lê no Diário, e é o
 * que permite desfazer o ato restaurando exatamente o estado anterior.
 */
export interface MarcoRetificado {
  /** Data que valia antes desta retificação. */
  dataHoraAnterior: string
  /** Fim da janela que valia antes, quando o marco é um período. */
  fimEmAnterior?: string
  /** Número da retificação que alterou este marco. */
  retificacaoNumero: string
}

/** Alteração de um marco pedida no formulário de retificação. */
export interface MarcoAlteracao {
  /** Índice do item no array do cronograma — identifica o marco sem ambiguidade. */
  indice: number
  /** Nova data do marco. */
  dataHora: string
  /** Novo fim de janela, quando o marco é um período. */
  fimEm?: string
}
