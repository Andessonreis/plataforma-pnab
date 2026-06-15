export type NoticiaDTO = {
  id: string
  titulo: string
  slug: string
  corpo: string
  tags: string[]
  imagemUrl: string | null
  publicado: boolean
  publicadoEm: string | null
  createdAt: string
  updatedAt: string
}
