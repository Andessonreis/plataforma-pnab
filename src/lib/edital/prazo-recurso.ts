import { ServiceError } from '@/lib/services/errors'
import { migrateLegacyCronograma } from '@/lib/utils/cronograma'
import { janelaParaAcaoFromItems } from '@/lib/utils/cronograma-janela'
import { formatDate } from '@/lib/utils/format'
import type { AcaoJanela } from '@/types/cronograma'

export interface PrazoRecurso {
  inicio: Date
  fim: Date
}

const SO_APOS_ENCERRAR = 'O extrato só pode ser emitido depois do encerramento.'

/**
 * Prazo de interposição da etapa, desde que já tenha terminado.
 *
 * O texto do extrato afirma que o prazo recursal se encerrou, então emitir com
 * a janela aberta, ou sem janela cadastrada, diria algo que o cronograma não
 * sustenta.
 */
export function prazoRecursoEncerrado(
  cronograma: unknown,
  acaoJanela: AcaoJanela,
  rotuloEtapa: string,
): PrazoRecurso {
  const etapa = rotuloEtapa.toLowerCase()

  // Item da mesma ação sem `fimEm` é marco pontual, não prazo. Se entrasse na
  // escolha, o mais recente dele ocultaria a janela real, já encerrada.
  const itens = migrateLegacyCronograma(cronograma).filter(
    (item) => !(item.tipo === 'custom' && item.acao === acaoJanela && !item.fimEm),
  )
  const janela = janelaParaAcaoFromItems(itens, acaoJanela)

  if (!janela?.fim) {
    throw new ServiceError(
      'LOCKED',
      `O cronograma do edital não define o período de recursos da etapa de ${etapa}. Cadastre-o antes de emitir o extrato.`,
    )
  }
  if (janela.status === 'antes') {
    throw new ServiceError(
      'LOCKED',
      `O prazo de recursos da etapa de ${etapa} ainda não começou (abre em ${formatDate(janela.inicio)}). ${SO_APOS_ENCERRAR}`,
    )
  }
  if (janela.status === 'ativa') {
    throw new ServiceError(
      'LOCKED',
      `O prazo de recursos da etapa de ${etapa} ainda não terminou (${formatDate(janela.inicio)} a ${formatDate(janela.fim)}). ${SO_APOS_ENCERRAR}`,
    )
  }

  return { inicio: janela.inicio, fim: janela.fim }
}

/** Recurso protocolado antes da abertura ou depois do fim da janela cadastrada. */
export function protocoladoForaDoPrazo(protocoladoEm: Date, { inicio, fim }: PrazoRecurso): boolean {
  return protocoladoEm < inicio || protocoladoEm > fim
}
