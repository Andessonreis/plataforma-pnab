import { unmaskTelefone, unmaskCep } from '@/lib/utils/format'
import type { DadosCadastro, TipoProponente } from './tipos'

/**
 * As duas chamadas que criam a conta: o registro em si e o anexo da declaração
 * do coletivo.
 *
 * Separadas do hook porque são a fronteira com o servidor — o hook cuida do
 * estado da ficha e não precisa saber que o telefone vai sem máscara nem que a
 * declaração sobe em `multipart`.
 */

const AVISO_UPLOAD =
  'Conta criada, mas não foi possível enviar a declaração. Envie posteriormente.'

interface ResultadoRegistro {
  ok: boolean
  userId?: string
  /** Mensagem de erro quando `ok` é falso. */
  erro?: string
}

export async function criarConta(
  dados: DadosCadastro,
  tipo: TipoProponente,
): Promise<ResultadoRegistro> {
  try {
    const resposta = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...dados,
        confirmPassword: undefined,
        cpfCnpj: dados.cpfCnpj.replace(/\D/g, ''),
        telefone: unmaskTelefone(dados.telefone),
        cep: unmaskCep(dados.cep),
        tipoProponente: tipo,
      }),
    })

    const registro = await resposta.json()

    if (!resposta.ok) return { ok: false, erro: registro.message || 'Erro ao criar conta.' }

    return { ok: true, userId: registro.userId }
  } catch {
    return { ok: false, erro: 'Erro de conexão. Tente novamente.' }
  }
}

/**
 * Anexa a declaração do coletivo à conta recém-criada. Devolve a ressalva a
 * mostrar, ou `null` quando deu certo.
 *
 * A conta já existe neste ponto, então uma falha aqui vira aviso e não erro:
 * bloquear o cadastro por causa do anexo deixaria a pessoa com conta criada e
 * sem saber que pode entrar.
 */
export async function enviarDeclaracao(
  arquivo: File,
  userId: string,
): Promise<string | null> {
  try {
    const corpo = new FormData()
    corpo.append('file', arquivo)
    corpo.append('userId', userId)

    const resposta = await fetch('/api/auth/register/upload-declaracao', {
      method: 'POST',
      body: corpo,
    })
    if (resposta.ok) return null

    const dadosResposta = await resposta.json()
    return dadosResposta.message || AVISO_UPLOAD
  } catch {
    return AVISO_UPLOAD
  }
}
