export interface CnpjEndereco {
  cep: string | null
  logradouro: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  municipio: string | null
  uf: string | null
}

export interface CnpjSocio {
  nome: string
  qualificacao: string | null
}

export interface CnpjCnae {
  codigo: string
  descricao: string
}

export interface CnpjLookupResult {
  cnpj: string
  razaoSocial: string
  nomeFantasia: string | null
  situacao: string
  dataSituacao: string | null
  cnaePrincipal: CnpjCnae | null
  endereco: CnpjEndereco
  telefone: string | null
  email: string | null
  socios: CnpjSocio[]
  fonte: 'brasilapi' | 'receitaws'
}
