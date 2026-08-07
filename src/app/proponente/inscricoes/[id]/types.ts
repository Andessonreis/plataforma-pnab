// Tipos locais dos dados exibidos no detalhe de inscrição — espelham o shape
// do `select`/`include` da query em page.tsx, não o model completo do Prisma.

export interface AnexoItem {
  id: string
  titulo: string
  tipo: string
  valido: boolean | null
}

export interface AvaliacaoItem {
  notaTotal: unknown
  parecer: string | null
  finalizada: boolean
  createdAt: Date
}

export interface RecursoRespostaItem {
  decisao: string | null
  justificativa: string
}

export interface RecursoItem {
  id: string
  fase: string
  texto: string
  urlAnexos: string[]
  decisao: string | null
  justificativa: string | null
  createdAt: Date
  respostas: RecursoRespostaItem[]
}
