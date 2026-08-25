// Dados do formulário guiado do Anexo 01 (Declaração de Parceria) — aparece em
// qualquer edital que tenha esse anexo cadastrado (ver ANEXO_01_TITULO em
// src/lib/pdf/templates/declaracao-parceria.ts), não é exclusivo de um edital.
// Em vez do proponente digitar por cima de um texto corrido com colchetes, ele
// preenche campos normais e a plataforma gera o PDF oficial com os mesmos
// colchetes preenchidos (nenhuma palavra do texto original é alterada).
// Persiste dentro de Inscricao.campos (chave reservada), mesmo padrão de
// src/types/auxilio-inscricao.ts — sem exigir migration.

export interface DeclaracaoParceria {
  mestreNome: string
  mestreCpf: string
  mestreTelefone: string
  parceriaNome: string
  parceriaCnpj: string
  parceriaEndereco: string
  parceriaTelefone: string
}

export const DECLARACAO_PARCERIA_CAMPO = 'declaracaoParceria'

export const DECLARACAO_PARCERIA_VAZIA: DeclaracaoParceria = {
  mestreNome: '',
  mestreCpf: '',
  mestreTelefone: '',
  parceriaNome: '',
  parceriaCnpj: '',
  parceriaEndereco: '',
  parceriaTelefone: '',
}

export function parseDeclaracaoParceria(value: unknown): DeclaracaoParceria {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return DECLARACAO_PARCERIA_VAZIA
  const v = value as Record<string, unknown>
  const str = (key: keyof DeclaracaoParceria) => (typeof v[key] === 'string' ? (v[key] as string) : '')
  return {
    mestreNome: str('mestreNome'),
    mestreCpf: str('mestreCpf'),
    mestreTelefone: str('mestreTelefone'),
    parceriaNome: str('parceriaNome'),
    parceriaCnpj: str('parceriaCnpj'),
    parceriaEndereco: str('parceriaEndereco'),
    parceriaTelefone: str('parceriaTelefone'),
  }
}
