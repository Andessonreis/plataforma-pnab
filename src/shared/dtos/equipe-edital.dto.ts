export type MembroEquipeDTO = {
  id: string
  nome: string
  email: string
}

export type EquipeEditalDTO = {
  avaliadores: MembroEquipeDTO[]
  habilitadores: MembroEquipeDTO[]
}
