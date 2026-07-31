import { ehCnpj, type DadosCadastro, type TipoProponente } from './tipos'

interface EstadoCadastro {
  tipo: TipoProponente
  dados: DadosCadastro
  declaracao: File | null
}

/**
 * Impedimentos de cada etapa do cadastro.
 *
 * Cada função devolve a mensagem do primeiro problema, ou `null` se a etapa
 * está completa. Separadas do hook porque são o contrato do avanço: o botão
 * "Continuar" só passa quando a etapa corrente devolve `null`, e o envio final
 * roda todas de novo — se a pessoa voltar e apagar um campo, o passo já
 * visitado não fica valendo como aprovado.
 *
 * As regras são as mesmas de quando a ficha era uma página só; aqui elas
 * apenas passam a saber a que etapa pertencem, para que o erro apareça na tela
 * onde o campo está.
 */
function validarIdentificacao({ tipo, dados, declaracao }: EstadoCadastro): string | null {
  if (!dados.nome.trim()) {
    return ehCnpj(tipo) ? 'Informe a razão social.' : 'Informe o nome completo.'
  }

  const documento = dados.cpfCnpj.replace(/\D/g, '')
  if (tipo === 'PF' && documento.length !== 11) return 'CPF deve ter 11 dígitos.'
  if (ehCnpj(tipo) && documento.length !== 14) return 'CNPJ deve ter 14 dígitos.'
  if (tipo === 'COLETIVO' && !declaracao) return 'Declaração do coletivo é obrigatória.'

  return null
}

function validarContato({ dados }: EstadoCadastro): string | null {
  if (!dados.email.includes('@')) return 'Informe um e-mail válido.'
  if (dados.telefone.replace(/\D/g, '').length < 10) return 'Informe um telefone com DDD.'
  if (!dados.cep || !dados.logradouro || !dados.bairro || !dados.cidade || !dados.uf) {
    return 'Preencha todos os campos de endereço obrigatórios.'
  }

  return null
}

function validarAcesso({ dados }: EstadoCadastro): string | null {
  if (dados.password.length < 8) return 'A senha deve ter no mínimo 8 caracteres.'
  if (dados.password !== dados.confirmPassword) return 'As senhas não coincidem.'

  return null
}

const VALIDACOES = [validarIdentificacao, validarContato, validarAcesso]

/** Impedimento da etapa indicada (base zero), ou `null` se ela está completa. */
export function validarPasso(passo: number, estado: EstadoCadastro): string | null {
  return VALIDACOES[passo]?.(estado) ?? null
}

/** Primeiro impedimento da ficha inteira — rede de segurança do envio. */
export function validarTudo(estado: EstadoCadastro): string | null {
  for (const validar of VALIDACOES) {
    const impedimento = validar(estado)
    if (impedimento) return impedimento
  }

  return null
}
