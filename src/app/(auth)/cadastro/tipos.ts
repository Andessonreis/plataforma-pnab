/** Naturezas jurídicas que a PNAB aceita como proponente. */
export type TipoProponente = 'PF' | 'PJ' | 'MEI' | 'COLETIVO'

export const ROTULOS_TIPO: Record<TipoProponente, string> = {
  PF: 'Pessoa Física',
  PJ: 'Pessoa Jurídica',
  MEI: 'MEI',
  COLETIVO: 'Coletivo Cultural',
}

/** PJ e MEI se inscrevem por CNPJ; muda máscara, rótulo e consulta à Receita. */
export function ehCnpj(tipo: TipoProponente): boolean {
  return tipo === 'PJ' || tipo === 'MEI'
}

/**
 * As três etapas do cadastro.
 *
 * A ficha inteira tem treze campos. Numa coluna só ela passava de mil e
 * quinhentos pixels, e formulário que parece longo é abandonado antes da
 * primeira letra — por isso o corte em etapas curtas, cada uma com um assunto:
 * quem é, onde te achamos, como você entra.
 */
export const PASSOS = [
  { titulo: 'Identificação', resumo: 'Quem está se inscrevendo' },
  { titulo: 'Contato', resumo: 'E-mail, telefone e endereço' },
  { titulo: 'Acesso', resumo: 'A senha da sua conta' },
] as const

export const TOTAL_PASSOS = PASSOS.length

export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const

export interface DadosCadastro {
  nome: string
  cpfCnpj: string
  email: string
  telefone: string
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
  password: string
  confirmPassword: string
}
