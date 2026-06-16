export type TipoProponente = 'PF' | 'PJ' | 'MEI' | 'COLETIVO'

export interface CadastroFormData {
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
