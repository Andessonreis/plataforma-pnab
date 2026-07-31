/**
 * Consultas que preenchem o cadastro sozinhas: CNPJ na Receita (via rota
 * interna) e CEP no ViaCEP.
 *
 * São funções puras de busca — devolvem o que veio e não tocam em estado.
 * A decisão de sobrescrever ou não o que a pessoa já digitou é de quem chama,
 * porque só lá se conhece o valor anterior de cada campo.
 */

const FALHA_CNPJ = 'Não foi possível consultar agora. Preencha manualmente.'

export interface EnderecoConsultado {
  cep?: string | null
  logradouro?: string | null
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  municipio?: string | null
  uf?: string | null
}

export interface ResultadoCnpj {
  razaoSocial?: string
  endereco?: EnderecoConsultado
  /** Mensagem para o campo — CNPJ inexistente, falha na consulta ou situação irregular. */
  dica: string
}

export async function buscarCnpj(digitos: string): Promise<ResultadoCnpj> {
  try {
    const resposta = await fetch('/api/cnpj/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cnpj: digitos }),
    })

    if (resposta.status === 404) {
      return { dica: 'CNPJ não encontrado na Receita. Preencha manualmente.' }
    }
    if (!resposta.ok) return { dica: FALHA_CNPJ }

    const { data } = await resposta.json()

    return {
      razaoSocial: data.razaoSocial,
      endereco: data.endereco,
      dica:
        data.situacao && data.situacao !== 'ATIVA'
          ? `Atenção: situação na Receita é "${data.situacao}".`
          : '',
    }
  } catch {
    return { dica: FALHA_CNPJ }
  }
}

export interface ResultadoCep {
  logradouro?: string
  bairro?: string
  localidade?: string
  uf?: string
}

/** Devolve null quando o CEP não existe ou o serviço não respondeu. */
export async function buscarCep(cep: string): Promise<ResultadoCep | null> {
  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
    const data = await resposta.json()
    return data.erro ? null : data
  } catch {
    return null
  }
}
