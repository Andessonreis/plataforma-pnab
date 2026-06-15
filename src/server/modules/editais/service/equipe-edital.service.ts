import { AUDIT_ACTIONS, logAudit } from '@/lib/audit'
import { BadRequestError, NotFoundError } from '@server/lib/http/errors'
import { editaisRepository } from '@server/modules/editais/repository/editais.repository'
import { EditalNaoEncontradoError } from '@server/modules/editais/errors/editais.errors'
import type { EquipeEditalDTO } from '@shared/dtos/equipe-edital.dto'
import type { FuncaoEdital } from '@shared/schemas/equipe-edital.schema'
import { equipeEditalRepository } from '../repository/equipe-edital.repository'

export const equipeEditalService = {
  async list(editalId: string): Promise<EquipeEditalDTO> {
    const edital = await editaisRepository.findById(editalId)
    if (!edital) throw new EditalNaoEncontradoError()

    const membros = await equipeEditalRepository.listByEdital(editalId)

    return {
      avaliadores: membros
        .filter((m) => m.funcao === 'AVALIADOR')
        .map((m) => ({ id: m.user.id, nome: m.user.nome, email: m.user.email })),
      habilitadores: membros
        .filter((m) => m.funcao === 'HABILITADOR')
        .map((m) => ({ id: m.user.id, nome: m.user.nome, email: m.user.email })),
    }
  },

  async add(
    editalId: string,
    userIds: string[],
    funcao: FuncaoEdital,
    ctx: { actorId: string; ip?: string | null },
  ): Promise<{ adicionados: number }> {
    const edital = await editaisRepository.findById(editalId)
    if (!edital) throw new EditalNaoEncontradoError()

    const users = await equipeEditalRepository.findEligibleUsers(userIds, funcao)
    const validIds = users.map((u) => u.id)
    const invalidIds = userIds.filter((id) => !validIds.includes(id))
    if (invalidIds.length > 0) {
      throw new BadRequestError(`Usuários inválidos: ${invalidIds.join(', ')}`)
    }

    const result = await equipeEditalRepository.createMany(editalId, validIds, funcao)

    for (const user of users) {
      await logAudit({
        userId: ctx.actorId,
        action: AUDIT_ACTIONS.MEMBRO_EDITAL_ADICIONADO,
        entity: 'EditalMembro',
        entityId: editalId,
        details: { funcao, membroId: user.id, membroNome: user.nome },
        ip: ctx.ip ?? undefined,
      })
    }

    return { adicionados: result.count }
  },

  async remove(
    editalId: string,
    userId: string,
    funcao: FuncaoEdital,
    ctx: { actorId: string; ip?: string | null },
  ): Promise<void> {
    const deleted = await equipeEditalRepository.delete(editalId, userId, funcao)
    if (deleted.count === 0) throw new NotFoundError('Membro não encontrado')

    await logAudit({
      userId: ctx.actorId,
      action: AUDIT_ACTIONS.MEMBRO_EDITAL_REMOVIDO,
      entity: 'EditalMembro',
      entityId: editalId,
      details: { funcao, membroId: userId },
      ip: ctx.ip ?? undefined,
    })
  },
}
