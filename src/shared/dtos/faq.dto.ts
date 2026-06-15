export type FaqItemDTO = {
  id: string
  editalId: string | null
  pergunta: string
  resposta: string
  ordem: number
  publicado: boolean
  createdAt: string
}
