import { prisma } from '@/lib/db'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'
import { getConfig } from '@/lib/memorial/config'
import { generateProtocolo } from '@/lib/atendimento/protocolo'
import { diaEmIrece, diaParaDate, diasEntre, intervaloDoMes } from '@/lib/memorial/agendamento/datas'
import { mensagemIndisponivel, motivoIndisponivel, situacaoDosHorarios, type SituacaoHorario } from '@/lib/memorial/agendamento/regras'
import { ehConflitoDeHorario, ocupacoesNoIntervalo, travarDia } from '@/lib/memorial/agendamento/ocupacao'
import { buscarPerguntasExtras, registrarPerguntasExtras } from '@/lib/memorial/agendamento/perguntas-extras'
import { avisarEquipeNovoPedido, avisarPedidoRecebido } from '@/lib/memorial/agendamento/notificar'
import { obterRegulamentoVigente } from './memorial-regulamento.service'
import { ServiceError } from './errors'
import type { DisponibilidadeQuery, SolicitarVisitaInput } from '@/lib/schemas/memorial-agendamento'

export interface DiaDisponivel {
  data: string
  horarios: SituacaoHorario[]
}

/**
 * Dias de visitação do mês (ou intervalo) pedido, de hoje em diante, com a grade inteira
 * de cada um e o motivo de cada horário indisponível. Nada sobre quem reservou sai
 * daqui: só se o horário está livre ou por que não está.
 */
export async function consultarDisponibilidade(query: DisponibilidadeQuery, agora = new Date()) {
  const regras = await getConfig('visitacao')
  const { de, ate } = query.mes ? intervaloDoMes(query.mes) : { de: query.de!, ate: query.ate! }
  const hoje = diaEmIrece(agora)
  const inicio = de < hoje ? hoje : de
  if (inicio > ate) return { de, ate, dias: [] as DiaDisponivel[] }

  const ocupacoes = await ocupacoesNoIntervalo(prisma, inicio, ate)
  const dias = diasEntre(inicio, ate)
    .map((data) => ({ data, horarios: situacaoDosHorarios(data, ocupacoes, regras, agora) }))
    .filter((d) => d.horarios.length > 0)
  return { de, ate, dias }
}

interface Solicitante {
  userId?: string
  ip?: string
}

async function protocoloLivre(): Promise<string> {
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const protocolo = generateProtocolo('MEM')
    const existe = await prisma.memorialAgendamento.findUnique({ where: { protocolo }, select: { id: true } })
    if (!existe) return protocolo
  }
  throw new ServiceError('CONFLICT', 'Não foi possível gerar o protocolo. Tente novamente.')
}

/**
 * Registra o pedido de visita. Todas as regras são conferidas de novo aqui, com o dia
 * travado, porque o calendário que a pessoa viu pode ter mudado enquanto ela preenchia.
 */
export async function solicitarVisita(input: SolicitarVisitaInput, solicitante: Solicitante = {}, agora = new Date()) {
  const [regras, regulamento, perguntas] = await Promise.all([
    getConfig('visitacao'),
    obterRegulamentoVigente(),
    buscarPerguntasExtras(),
  ])
  if (!regulamento) {
    throw new ServiceError('LOCKED', 'O agendamento de visitas ainda não está aberto. Tente novamente em breve.')
  }
  if (input.regulamentoVersao !== regulamento.versao) {
    throw new ServiceError('CONFLICT', 'O regulamento de visitação foi atualizado. Leia a versão nova e confirme de novo.')
  }

  const protocolo = await protocoloLivre()

  const visita = await prisma
    .$transaction(async (tx) => {
      await travarDia(tx, input.data)
      const ocupacoes = await ocupacoesNoIntervalo(tx, input.data, input.data)
      const motivo = motivoIndisponivel(input, ocupacoes, regras, agora)
      if (motivo) throw new ServiceError(motivo === 'HORARIO_OCUPADO' ? 'CONFLICT' : 'BAD_REQUEST', mensagemIndisponivel(motivo, regras))

      const respostaId = perguntas
        ? await registrarPerguntasExtras(tx, perguntas.id, input.perguntasExtras ?? {}, {
            userId: solicitante.userId,
            nome: input.responsavelNome,
            email: input.responsavelEmail,
          })
        : undefined

      return tx.memorialAgendamento.create({
        data: {
          protocolo,
          userId: solicitante.userId ?? null,
          tipoVisitante: input.tipoVisitante,
          instituicao: input.instituicao,
          quantidade: input.quantidade,
          faixaEtaria: input.faixaEtaria,
          turma: input.turma ?? null,
          endereco: input.endereco ?? null,
          cidade: input.cidade ?? null,
          responsavelNome: input.responsavelNome,
          responsavelCargo: input.responsavelCargo ?? null,
          responsavelEmail: input.responsavelEmail,
          responsavelTelefone: input.responsavelTelefone,
          data: diaParaDate(input.data),
          turno: input.turno,
          horaInicio: input.horaInicio,
          horaFim: input.horaFim,
          observacoes: input.observacoes ?? null,
          necessidades: input.necessidades ?? null,
          preferenciaContato: input.preferenciaContato,
          regulamentoVersao: regulamento.versao,
          aceiteEm: agora,
          respostaId: respostaId ?? null,
        },
      })
    })
    .catch((err: unknown) => {
      // Rede de segurança do banco: o índice único de horário ativo barra o que a trava não pegou.
      if (ehConflitoDeHorario(err)) throw new ServiceError('CONFLICT', mensagemIndisponivel('HORARIO_OCUPADO', regras))
      throw err
    })

  await logAudit({
    userId: solicitante.userId,
    action: AUDIT_ACTIONS.MEMORIAL_AGENDAMENTO_SOLICITADO,
    entity: 'MemorialAgendamento',
    entityId: visita.id,
    details: { protocolo, data: input.data, turno: input.turno, quantidade: input.quantidade, regulamentoVersao: regulamento.versao },
    ip: solicitante.ip,
  })

  const copiaEnviada = await avisarPedidoRecebido(visita, regras.textoSolicitacaoRecebida)
  await avisarEquipeNovoPedido(visita)

  return {
    protocolo: visita.protocolo,
    status: visita.status,
    data: input.data,
    horaInicio: visita.horaInicio,
    horaFim: visita.horaFim,
    mensagem: regras.textoSolicitacaoRecebida,
    /** A cópia chegou à fila de e-mail; a tela só promete o envio quando isso deu certo. */
    copiaEnviada,
  }
}

/** Campos de uma visita que o próprio visitante acompanha (lista e painel). */
export const SELECT_MINHA_VISITA = {
  id: true,
  protocolo: true,
  status: true,
  data: true,
  turno: true,
  horaInicio: true,
  horaFim: true,
  instituicao: true,
  quantidade: true,
  motivoRecusa: true,
} as const

/** Visitas pedidas pela própria conta — a lista de "minhas visitas". */
export async function listarMinhasVisitas(userId: string, page: number, pageSize: number) {
  const where = { userId }
  const [itens, total] = await Promise.all([
    prisma.memorialAgendamento.findMany({
      where,
      orderBy: { data: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: SELECT_MINHA_VISITA,
    }),
    prisma.memorialAgendamento.count({ where }),
  ])
  return { itens, total }
}
