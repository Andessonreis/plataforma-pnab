import { ROLES_MEMORIAL_COMPLETO } from '@/lib/memorial/acesso'
import type { MemorialAgendamento } from '@prisma/client'
import { prisma } from '@/lib/db'
import { enqueueEmail } from '@/lib/queue'
import { getConfig } from '@/lib/memorial/config'
import type { DadosVisitaEmail } from '@/lib/mail/templates/memorial/detalhes-visita'
import { dateParaDia, formatarDiaPorExtenso } from './datas'
import { linkFalarComSecretaria } from './contato-secretaria'

/**
 * E-mails do agendamento. Cada envio é isolado: se a fila cair, a visita continua
 * gravada e só o aviso se perde. Os logs levam o protocolo, nunca nome ou e-mail.
 */

const SITE_URL_FALLBACK = 'https://culturaeturismo.irece.ba.gov.br'

type Visita = Pick<
  MemorialAgendamento,
  | 'id'
  | 'protocolo'
  | 'data'
  | 'horaInicio'
  | 'horaFim'
  | 'instituicao'
  | 'quantidade'
  | 'responsavelNome'
  | 'responsavelEmail'
  | 'tipoVisitante'
>

function dadosVisita(v: Visita): DadosVisitaEmail {
  return {
    protocolo: v.protocolo,
    data: formatarDiaPorExtenso(dateParaDia(v.data)),
    horario: `${v.horaInicio} às ${v.horaFim}`,
    instituicao: v.instituicao,
    quantidade: v.quantidade,
  }
}

/** Devolve se o e-mail entrou na fila, para a tela não prometer uma cópia que não saiu. */
async function semDerrubar(protocolo: string, descricao: string, envio: () => Promise<unknown>): Promise<boolean> {
  try {
    await envio()
    return true
  } catch (err) {
    console.error({ protocolo, message: `Falha ao enfileirar e-mail: ${descricao}`, error: err instanceof Error ? err.message : 'Unknown' })
    return false
  }
}

function urlDoSite(caminho: string): string {
  return `${(process.env.NEXT_PUBLIC_SITE_URL || SITE_URL_FALLBACK).replace(/\/$/, '')}${caminho}`
}

async function emailDeContato(): Promise<string | undefined> {
  const contato = await getConfig('contato')
  return contato.email || undefined
}

export async function avisarPedidoRecebido(v: Visita, aviso: string): Promise<boolean> {
  return semDerrubar(v.protocolo, 'pedido recebido', async () =>
    enqueueEmail({
      to: v.responsavelEmail,
      template: 'memorial_solicitacao_recebida',
      data: {
        ...dadosVisita(v),
        nome: v.responsavelNome,
        aviso,
        contatoEmail: await emailDeContato(),
        contatoUrl: urlDoSite(linkFalarComSecretaria(v.protocolo)),
      },
    }),
  )
}

/** Notificação do sino do painel, sem campanha: uma por pessoa da equipe, apontando para o pedido. */
async function notificarEquipeNoPainel(v: Visita, userIds: string[]) {
  if (userIds.length === 0) return
  const d = dadosVisita(v)
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      titulo: 'Novo pedido de visita ao Memorial',
      corpo: `${d.instituicao} (${d.quantidade} pessoas) pediu visita em ${d.data}, ${d.horario}. Protocolo ${d.protocolo}.`,
      link: `/admin/memorial/agendamentos/${v.id}`,
      ctaLabel: 'Ver pedido',
      canais: ['IN_APP' as const],
    })),
  })
}

/**
 * Equipe do Memorial ativa (ADMIN, COMUNICACAO e SUPER_ADMIN) recebe a notificação no sino
 * e o e-mail; o e-mail institucional do Memorial também recebe, sem repetir endereço.
 */
export async function avisarEquipeNovoPedido(v: Visita) {
  await semDerrubar(v.protocolo, 'alerta da equipe', async () => {
    const [equipe, contato] = await Promise.all([
      prisma.user.findMany({ where: { role: { in: ROLES_MEMORIAL_COMPLETO }, ativo: true }, select: { id: true, nome: true, email: true } }),
      emailDeContato(),
    ])
    await semDerrubar(v.protocolo, 'notificação da equipe no painel', () =>
      notificarEquipeNoPainel(v, equipe.map((p) => p.id)),
    )
    const destinatarios = new Map(equipe.map((p) => [p.email.toLowerCase(), p.nome]))
    if (contato && !destinatarios.has(contato.toLowerCase())) destinatarios.set(contato.toLowerCase(), 'Equipe do Memorial')

    const url = urlDoSite(`/admin/memorial/agendamentos/${v.id}`)
    await Promise.all(
      [...destinatarios].map(([email, nome]) =>
        enqueueEmail({
          to: email,
          template: 'memorial_nova_solicitacao',
          data: { ...dadosVisita(v), nomeDestinatario: nome, tipoVisitante: v.tipoVisitante, url },
        }),
      ),
    )
  })
}

export async function avisarConfirmacao(v: Visita, remarcada = false) {
  await semDerrubar(v.protocolo, remarcada ? 'visita remarcada' : 'visita confirmada', async () =>
    enqueueEmail({
      to: v.responsavelEmail,
      template: 'memorial_visita_confirmada',
      data: { ...dadosVisita(v), nome: v.responsavelNome, remarcada, contatoEmail: await emailDeContato() },
    }),
  )
}

export async function avisarRecusa(v: Visita, situacao: 'RECUSADA' | 'CANCELADA', motivo: string) {
  await semDerrubar(v.protocolo, `visita ${situacao.toLowerCase()}`, async () =>
    enqueueEmail({
      to: v.responsavelEmail,
      template: 'memorial_visita_recusada',
      data: { ...dadosVisita(v), nome: v.responsavelNome, situacao, motivo, contatoEmail: await emailDeContato() },
    }),
  )
}
