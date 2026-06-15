import type { UserRole } from '@prisma/client'
import { logAudit } from '@server/lib/audit'
import { enqueueEmail } from '@server/lib/queue'
import { gateAcaoFase } from '@shared/edital/gate'
import { InscricaoNaoEncontradaError } from '@server/modules/inscricoes/errors/inscricoes.errors'
import type { HabilitacaoInput } from '@shared/schemas/habilitacao.schema'
import { habilitacaoRepository } from '../repository/habilitacao.repository'
import { ForaDaFaseError } from '../errors/habilitacao.errors'

export async function updateHabilitacao(
  inscricaoId: string,
  data: HabilitacaoInput,
  userId: string,
  role: UserRole,
  ip?: string,
) {
  const inscricao = await habilitacaoRepository.findParaHabilitacao(inscricaoId)
  if (!inscricao) throw new InscricaoNaoEncontradaError()

  const gate = gateAcaoFase({
    editalStatus: inscricao.edital.status,
    acao: 'habilitar',
    role,
    override: data.adminOverride,
  })

  if (!gate.ok) {
    await logAudit({
      userId,
      action: 'HABILITACAO_FORA_DA_FASE_BLOQUEADA',
      entity: 'Inscricao',
      entityId: inscricaoId,
      details: {
        editalStatus: inscricao.edital.status,
        tentativaStatus: data.status,
        motivo: gate.mensagem,
      },
      ip,
    })
    throw new ForaDaFaseError(gate.mensagem)
  }

  const motivoInabilitacao = data.status === 'INABILITADA' ? (data.motivo ?? null) : null
  await habilitacaoRepository.aplicar(inscricaoId, data.status, motivoInabilitacao)

  await logAudit({
    userId,
    action: data.status === 'HABILITADA' ? 'INSCRICAO_HABILITADA' : 'INSCRICAO_INABILITADA',
    entity: 'Inscricao',
    entityId: inscricaoId,
    details: {
      numero: inscricao.numero,
      statusAnterior: inscricao.status,
      novoStatus: data.status,
      motivo: data.motivo ?? null,
      adminOverride: gate.overrideUsed,
      adminOverrideJustificativa: gate.overrideUsed ? data.adminOverrideJustificativa : null,
      editalStatus: inscricao.edital.status,
    },
    ip,
  })

  try {
    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
    await enqueueEmail({
      to: inscricao.proponente.email,
      subject: `Resultado da Habilitação — ${inscricao.edital.titulo}`,
      template: 'habilitacao',
      data: {
        nome: inscricao.proponente.nome,
        numero: inscricao.numero,
        edital: inscricao.edital.titulo,
        resultado: data.status,
        motivo: data.motivo ?? null,
        url: `${baseUrl}/proponente/inscricoes`,
      },
    })
  } catch {
    console.error('[habilitacao] Falha ao enfileirar e-mail de habilitação')
  }

  return {
    mensagem: `Inscrição ${data.status === 'HABILITADA' ? 'habilitada' : 'inabilitada'} com sucesso.`,
  }
}
