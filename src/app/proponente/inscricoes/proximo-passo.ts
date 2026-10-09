import type { EditalStatus, InscricaoStatus } from '@prisma/client'
import { faseDoRecurso, situacaoRecurso } from '@/lib/edital/recurso-proponente'
import { parseCronograma } from '@/lib/utils/cronograma'
import { formatDate, formatDateTime, parseBrazilDateTime } from '@/lib/utils/format'

/**
 * O que a situação quer dizer, na voz de quem se inscreveu. O rótulo do
 * carimbo diz o nome da fase; esta frase diz o que acontece agora.
 */
export const SITUACAO_EXPLICADA: Record<InscricaoStatus, string> = {
  RASCUNHO: 'Ainda não enviada à Secretaria.',
  ENVIADA: 'Recebida. A documentação está sendo conferida.',
  HABILITADA: 'Documentação aprovada. Segue para a avaliação.',
  INABILITADA: 'Não passou na conferência da documentação.',
  EM_AVALIACAO: 'O projeto está com a comissão de avaliação.',
  RESULTADO_PRELIMINAR: 'Resultado preliminar publicado.',
  RECURSO_ABERTO: 'Os recursos deste edital estão sendo analisados.',
  RESULTADO_FINAL: 'Resultado final publicado.',
  CONTEMPLADA: 'Projeto contemplado nesta seleção.',
  NAO_CONTEMPLADA: 'Não foi contemplada nesta seleção.',
  SUPLENTE: 'Na lista de suplentes. Pode ser convocada se abrir vaga.',
}

const STATUS_COM_RESULTADO: InscricaoStatus[] = [
  'INABILITADA',
  'RESULTADO_PRELIMINAR',
  'RESULTADO_FINAL',
  'CONTEMPLADA',
  'NAO_CONTEMPLADA',
  'SUPLENTE',
]

export interface EntradaProximoPasso {
  id: string
  /** Status já filtrado por `statusVisivelParaProponente`. */
  status: InscricaoStatus
  editalStatus: EditalStatus
  cronograma: unknown
  fasesRecorridas: string[]
  agora?: Date
}

export interface ProximoPasso {
  rotulo: string
  href: string
  /** Pede ação do proponente com prazo: vira o botão cheio da ficha. */
  urgente: boolean
  /** Prazo ou ressalva que acompanha a ação, já em texto. */
  aviso: string | null
}

/** Fim das inscrições conforme o cronograma do edital, se cadastrado. */
function fimDasInscricoes(cronograma: unknown): Date | null {
  const marco = parseCronograma(cronograma).find((item) => item.fase === 'INSCRICOES_ENCERRADAS')
  return marco ? parseBrazilDateTime(marco.dataHora) : null
}

/**
 * A ação que mais importa para cada inscrição da lista. Segue a mesma regra
 * de recurso da tela de detalhe (`situacaoRecurso`), então a lista nunca
 * oferece um recurso que o formulário recusaria.
 */
export function proximoPasso({
  id,
  status,
  editalStatus,
  cronograma,
  fasesRecorridas,
  agora = new Date(),
}: EntradaProximoPasso): ProximoPasso {
  const detalhe = `/proponente/inscricoes/${id}`

  if (status === 'RASCUNHO') {
    if (editalStatus !== 'INSCRICOES_ABERTAS') {
      return {
        rotulo: 'Ver rascunho',
        href: detalhe,
        urgente: false,
        aviso: 'As inscrições deste edital terminaram. O rascunho não pode mais ser enviado.',
      }
    }
    const fim = fimDasInscricoes(cronograma)
    return {
      rotulo: 'Continuar inscrição',
      href: `${detalhe}/editar`,
      urgente: true,
      aviso: fim && fim > agora ? `Envie até ${formatDateTime(fim)}` : 'Inscrições abertas',
    }
  }

  const recurso = situacaoRecurso(status, cronograma, fasesRecorridas, agora)
  if (recurso?.aberto) {
    return {
      rotulo: 'Enviar recurso',
      href: `${detalhe}#interpor-recurso`,
      urgente: true,
      aviso: recurso.janela?.fim ? `Prazo até ${formatDateTime(recurso.janela.fim)}` : 'Prazo de recurso aberto',
    }
  }

  const temResultado = STATUS_COM_RESULTADO.includes(status)
  const rotulo = temResultado ? 'Ver resultado' : 'Acompanhar'

  if (recurso?.janela?.status === 'antes') {
    return { rotulo, href: detalhe, urgente: false, aviso: `Recurso a partir de ${formatDate(recurso.janela.inicio)}` }
  }

  const fase = faseDoRecurso(status)
  if (fase && fasesRecorridas.includes(fase)) {
    return { rotulo, href: detalhe, urgente: false, aviso: 'Recurso enviado. Aguarde a decisão.' }
  }

  return { rotulo, href: detalhe, urgente: false, aviso: null }
}
