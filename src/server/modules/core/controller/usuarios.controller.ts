import type { RequestContext } from '@server/adapters/next-route'
import { ForbiddenError } from '@server/lib/http/errors'
import { resolveApiCaller, callerHasRole, ipFromHeaders } from '@server/lib/auth/api-caller'
import {
  cadastroInputSchema,
  recuperacaoSenhaInputSchema,
  redefinicaoSenhaInputSchema,
  buscaUsuariosInputSchema,
} from '@shared/schemas/usuarios.schema'
import type { BuscaUsuarioDTO, CadastroResultDTO, GenericMessageDTO } from '@shared/dtos/usuarios.dto'
import { usuariosService } from '../service/usuarios.service'

export const usuariosController = {
  async buscar(ctx: RequestContext) {
    const caller = await resolveApiCaller(ctx.headers)
    if (!callerHasRole(caller, 'ADMIN')) throw new ForbiddenError('Acesso negado.')
    const input = buscaUsuariosInputSchema.parse(ctx.query)
    const data = (await usuariosService.buscar(input)) as BuscaUsuarioDTO[]
    return { data }
  },

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
