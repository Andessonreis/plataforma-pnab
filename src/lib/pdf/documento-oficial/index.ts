/**
 * Identidade visual única dos documentos oficiais do portal.
 *
 * Todo PDF que sai do sistema — lista de classificação, comprovante de
 * inscrição, relatório de recursos — usa este timbre, este rodapé e este
 * protocolo, para que se reconheçam como peças do mesmo órgão. O desenho segue
 * o Diário Oficial do Município de Irecê, que é onde esses documentos acabam
 * publicados ou anexados.
 */
export { CORES, FONTES, PAGINA, LARGURA_UTIL, X_ESQUERDA, X_DIREITA, LIMITE_CONTEUDO, fio, dataHora, dataPorExtenso } from './tema'
export { MARCAS, PROPORCAO, carregarMarca, gerarQrCode } from './assets'
export { tarjaSecao, caixaRotulada, linhaDado, separador } from './blocos'
export { contextoDe, type DocumentoOficial } from './contexto'
export { desenharCromo, desenharAbertura } from './timbre'
export { desenharRodape, desenharEncerramento, ALTURA_ENCERRAMENTO } from './rodape'
export {
  criarDocumentoOficial, novaPagina, garantirEspaco, docParaBuffer,
  type AberturaDocumento,
} from './pagina'
export { finalizarDocumento, type ItemProtocolo } from './protocolo'
