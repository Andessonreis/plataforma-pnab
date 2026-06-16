export type SlideDTO = {
  id: string
  titulo: string
  descricao: string | null
  imagemUrl: string | null
  ctaLabel: string | null
  ctaUrl: string | null
  ordem: number
  ativo: boolean
  inicioEm: string | null
  fimEm: string | null
  createdAt: string
  updatedAt: string
}
