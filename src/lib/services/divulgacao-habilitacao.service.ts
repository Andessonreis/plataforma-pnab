import type { InscricaoStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { PUBLICACAO_STATUS_FILTER } from '@/lib/edital/publicacoes'
import { enqueueEmail } from '@/lib/queue'
import { siteBaseUrl } from '@/lib/utils/site-url'
import type { ResultadoDivulgacao, ResumoDivulgacao } from '@/types/divulgacao-habilitacao'
import { ServiceError } from './errors'

/**
 * Divulgação do resultado da habilitação.
 *
 * Marcar habilitada/inabilitada é conferência interna: o proponente só passa a
 * ver o resultado (e a lista pública só o inclui) quando a Secretaria divulga,
 * o que grava `Inscricao.resultadoLiberadoEm`. Divulgar não depende de fase nem
 * de data do cronograma — é ato explícito e pode ser repetido para quem for
 * decidido depois.
 */

/**
 * Inscrições com habilitação decidida: as mesmas que a lista pública considera.
 * Inclui quem já avançou (em avaliação, contemplada...), porque atribuir
 * avaliador ou decidir recurso muda o status sem divulgar nada — ficar de fora
 * deixaria a inscrição sem divulgação para sempre.
 *
 * RECURSO_ABERTO é a exceção: é o status de quem foi inabilitada e recorreu, e
 * quem recorre já viu o resultado. Ali `resultadoLiberadoEm` nulo é
 * inconsistência, não pendência — divulgar trataria como habilitada e avisaria
 * "habilitada" a uma inabilitada.
 */
const STATUS_DECIDIDOS = PUBLICACAO_STATUS_FILTER.PUBLICACAO_HABILITADOS.filter(
  (status) => status !== 'RECURSO_ABERTO',
)
const STATUS_HABILITADOS = STATUS_DECIDIDOS.filter((status) => status !== 'INABILITADA')

export interface DivulgarResultadoInput {
  editalId: string
  enviarEmail: boolean
  /** Quantidade que a tela mostrou ao operador; divergir cancela a divulgação. */
  totalEsperado: number
  userId: string
  ip?: string
}

interface InscricaoDivulgada {
  numero: string
  status: InscricaoStatus
  motivoInabilitacao: string | null
  proponente: { nome: string; email: string }
}

/** Decididas pela equipe e ainda não divulgadas ao proponente. */
function aguardandoDivulgacao(editalId: string) {
  return { editalId, status: { in: STATUS_DECIDIDOS }, resultadoLiberadoEm: null }
}

export async function getResumoDivulgacao(editalId: string): Promise<ResumoDivulgacao> {
  const pendentes = aguardandoDivulgacao(editalId)
  const [habilitadas, inabilitadas, jaDivulgadas, emConferencia] = await Promise.all([
    prisma.inscricao.count({ where: { ...pendentes, status: { in: STATUS_HABILITADOS } } }),
    prisma.inscricao.count({ where: { ...pendentes, status: 'INABILITADA' } }),
    // Depois de divulgada a inscrição segue para outras fases, então a contagem
    // não pode filtrar por status.
    prisma.inscricao.count({ where: { editalId, resultadoLiberadoEm: { not: null } } }),
    prisma.inscricao.count({ where: { editalId, status: 'ENVIADA' } }),
  ])

  return {
    aDivulgar: { habilitadas, inabilitadas, total: habilitadas + inabilitadas },
    jaDivulgadas,
    emConferencia,
  }
}

/**
 * Um e-mail por inscrição, com falha isolada: o resultado já está divulgado e
 * um endereço com problema não pode impedir o aviso dos demais.
 */
async function enfileirarEmails(tituloEdital: string, divulgadas: InscricaoDivulgada[]) {
  const url = `${siteBaseUrl()}/proponente/inscricoes`

  const envios = await Promise.allSettled(
    divulgadas.map(async (inscricao) => {
      // O template imprime o valor recebido, então o status cru da inscrição
      // (EM_AVALIACAO, CONTEMPLADA...) não pode ir no lugar do resultado.
      const inabilitada = inscricao.status === 'INABILITADA'
      return enqueueEmail({
        to: inscricao.proponente.email,
        subject: `Resultado da Habilitação — ${tituloEdital}`,
        template: 'habilitacao',
        data: {
          nome: inscricao.proponente.nome,
          numero: inscricao.numero,
          edital: tituloEdital,
          resultado: inabilitada ? 'INABILITADA' : 'HABILITADA',
          motivo: inabilitada ? inscricao.motivoInabilitacao : null,
          url,
        },
      })
    }),
  )

  const falhas = envios.filter((envio) => envio.status === 'rejected').length
  if (falhas > 0) {
    console.error({ escopo: 'divulgacao-habilitacao', msg: 'Falha ao enfileirar e-mails de resultado', falhas })
  }
  return { enfileirados: envios.length - falhas, falhas }
}

export async function divulgarResultadoHabilitacao({
  editalId,
  enviarEmail,
  totalEsperado,
  userId,
  ip,
}: DivulgarResultadoInput): Promise<ResultadoDivulgacao> {
  const edital = await prisma.edital.findUnique({ where: { id: editalId }, select: { titulo: true } })
  if (!edital) throw new ServiceError('NOT_FOUND', 'Edital não encontrado.')

  // A marca de tempo identifica exatamente o que esta chamada divulgou, mesmo
  // que outra divulgação corra ao mesmo tempo no mesmo edital.
  const divulgadoEm = new Date()

  // Divulgar é irreversível e o e-mail não se desfaz, então a quantidade só
  // vale se for a que o operador confirmou: divergindo, a transação é
  // revertida sem liberar nada.
  const divulgadas = await prisma.$transaction(async (tx) => {
    const { count } = await tx.inscricao.updateMany({
      where: aguardandoDivulgacao(editalId),
      data: { resultadoLiberadoEm: divulgadoEm },
    })
    if (count !== totalEsperado) {
      throw new ServiceError(
        'CONFLICT',
        `A lista mudou desde que a tela foi aberta (esperado ${totalEsperado}, agora ${count}). ` +
          'Atualize a tela e confira antes de divulgar.',
      )
    }
    if (count === 0) {
      throw new ServiceError('CONFLICT', 'Não há inscrição decidida aguardando divulgação.')
    }

    return tx.inscricao.findMany({
      where: { editalId, resultadoLiberadoEm: divulgadoEm },
      select: {
        numero: true,
        status: true,
        motivoInabilitacao: true,
        proponente: { select: { nome: true, email: true } },
      },
      orderBy: { numero: 'asc' },
    })
  })

  const inabilitadas = divulgadas.filter((inscricao) => inscricao.status === 'INABILITADA').length
  const habilitadas = divulgadas.length - inabilitadas
  const emails = enviarEmail
    ? await enfileirarEmails(edital.titulo, divulgadas)
    : { enfileirados: 0, falhas: 0 }

  await logAudit({
    userId,
    action: 'RESULTADO_HABILITACAO_DIVULGADO',
    entity: 'Edital',
    entityId: editalId,
    details: {
      editalTitulo: edital.titulo,
      inscricoesDivulgadas: divulgadas.length,
      habilitadas,
      inabilitadas,
      numeros: divulgadas.map((inscricao) => inscricao.numero),
      enviarEmail,
      emailsEnfileirados: emails.enfileirados,
      emailsComFalha: emails.falhas,
    },
    ip,
  })

  return { divulgadas: divulgadas.length, habilitadas, inabilitadas, emails }
}
