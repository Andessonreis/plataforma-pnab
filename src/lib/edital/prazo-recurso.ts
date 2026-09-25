import { ServiceError } from '@/lib/services/errors'
import { migrateLegacyCronograma } from '@/lib/utils/cronograma'
import { janelaParaAcaoFromItems, type JanelaInfo } from '@/lib/utils/cronograma-janela'
import { formatDate } from '@/lib/utils/format'
import type { AcaoJanela } from '@/types/cronograma'

export interface PrazoRecurso {
  inicio: Date
  fim: Date
}

const SO_APOS_ENCERRAR = 'O extrato só pode ser emitido depois do encerramento.'

/**
 * Janela cadastrada para a ação, ou null. Item da mesma ação sem `fimEm` é
 * marco pontual, não prazo: se entrasse na escolha, o mais recente dele
 * ocultaria a janela real, já encerrada. O extrato em PDF e a página pública
 * do resultado dos recursos leem o prazo por aqui, para mostrarem o mesmo.
 */
export function janelaDoRecurso(cronograma: unknown, acaoJanela: AcaoJanela): JanelaInfo | null {
  const itens = migrateLegacyCronograma(cronograma).filter(
    (item) => !(item.tipo === 'custom' && item.acao === acaoJanela && !item.fimEm),
  )
  return janelaParaAcaoFromItems(itens, acaoJanela)
}

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

  const janela = janelaDoRecurso(cronograma, acaoJanela)

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
