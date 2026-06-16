import type { SessaoDTO } from '@shared/dtos/autenticacao.dto'
import type { LoginInput } from '@shared/schemas/autenticacao.schema'
import type {
  CadastroResultDTO,
  GenericMessageDTO,
} from '@shared/dtos/usuarios.dto'
import type {
  CadastroInput,
  RecuperacaoSenhaInput,
  RedefinicaoSenhaInput,
} from '@shared/schemas/usuarios.schema'

import { unwrap } from './_http'

export const autenticacaoClient = {
  async login(input: LoginInput): Promise<SessaoDTO> {
    const res = await fetch('/api/v1/autenticacao/sessoes/sessao', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
      credentials: 'same-origin',
    })
    return unwrap<SessaoDTO>(res)
  },

  async logout(): Promise<void> {
    await fetch('/api/v1/autenticacao/sessoes/sessao', {
      method: 'DELETE',
      credentials: 'same-origin',
    })
  },

  async sessaoAtual(): Promise<SessaoDTO | null> {
    const res = await fetch('/api/v1/autenticacao/sessoes/sessao/atual', {
      method: 'GET',
      credentials: 'same-origin',
    })
    if (res.status === 401) return null
    return unwrap<SessaoDTO>(res)
  },

  async refresh(): Promise<SessaoDTO | null> {
    const res = await fetch('/api/v1/autenticacao/sessoes/sessao/renovacao', {
      method: 'POST',
      credentials: 'same-origin',
    })
    if (!res.ok) return null
    return unwrap<SessaoDTO>(res)
  },

  async cadastrar(input: CadastroInput): Promise<CadastroResultDTO> {
    const res = await fetch('/api/v1/autenticacao/usuarios/usuario', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
      credentials: 'same-origin',
    })
    return unwrap<CadastroResultDTO>(res)
  },

  async solicitarRecuperacaoSenha(input: RecuperacaoSenhaInput): Promise<GenericMessageDTO> {
    const res = await fetch('/api/v1/autenticacao/senhas/recuperacao', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
      credentials: 'same-origin',
    })
    return unwrap<GenericMessageDTO>(res)
  },

  async redefinirSenha(input: RedefinicaoSenhaInput): Promise<GenericMessageDTO> {
    const res = await fetch('/api/v1/autenticacao/senhas/redefinicao', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
      credentials: 'same-origin',
    })
    return unwrap<GenericMessageDTO>(res)
  },
}
