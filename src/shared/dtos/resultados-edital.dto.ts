export type ResultadoItemDTO = {
  posicao: number
  inscricaoId: string
  numero: string
  proponenteNome: string
  categoria: string | null
  notaFinal: number | null
  status: string
  totalAvaliacoes: number
}

export type ResultadosListagemDTO = {
  edital: { id: string; titulo: string; status: string }
  resultados: ResultadoItemDTO[]
  hasEmpates: boolean
}

export type PublicacaoResultadoDTO = {
  mensagem: string
  totalInscricoes: number
  hasEmpates: boolean
}
