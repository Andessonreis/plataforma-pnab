import type { RequestContext } from '@server/adapters/next-route'
import {
  cadastroInputSchema,
  recuperacaoSenhaInputSchema,
  redefinicaoSenhaInputSchema,
} from '@shared/schemas/usuarios.schema'
import type { CadastroResultDTO, GenericMessageDTO } from '@shared/dtos/usuarios.dto'
import { usuariosService } from '../service/usuarios.service'

function ipFromHeaders(headers: Headers): string | null {
  return (
    headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    headers.get('x-real-ip') ??
    null
  )
}

export const usuariosController = {
  async cadastrar(ctx: RequestContext) {
    const input = cadastroInputSchema.parse(ctx.body)
    const usuario = await usuariosService.cadastrar(input, { ip: ipFromHeaders(ctx.headers) })

    const data: CadastroResultDTO = {
      usuario,
      mensagem: 'Conta criada com sucesso',
    }
    return { data, status: 201 }
  },

  async solicitarRecuperacaoSenha(ctx: RequestContext) {
    const input = recuperacaoSenhaInputSchema.parse(ctx.body)
    await usuariosService.solicitarRecuperacaoSenha(input, { ip: ipFromHeaders(ctx.headers) })

    const data: GenericMessageDTO = {
      mensagem: 'Se os dados estiverem cadastrados, você receberá um e-mail com instruções para redefinir sua senha',
    }
    return { data, status: 200 }
  },

  async redefinirSenha(ctx: RequestContext) {
    const input = redefinicaoSenhaInputSchema.parse(ctx.body)
    await usuariosService.redefinirSenha(input, { ip: ipFromHeaders(ctx.headers) })

    const data: GenericMessageDTO = { mensagem: 'Senha redefinida com sucesso' }
    return { data, status: 200 }
  },
}
