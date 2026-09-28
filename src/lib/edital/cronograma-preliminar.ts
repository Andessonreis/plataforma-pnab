import type { AcaoJanela } from '@/types/cronograma'

/**
 * Liga ao cronograma o que a publicação do resultado preliminar precisa.
 *
 * O link "Ver lista" do cronograma aparece assim que o marco tem a ação de resultado e a data
 * chegou. Por isso a ação não pode ser posta antes: o botão levaria a uma página ainda vazia.
 * A publicação faz as duas ligações no mesmo ato em que grava o resultado.
 *
 * - marco da publicação dos projetos selecionados → ação de publicação do resultado preliminar;
 * - marco do período de recursos da seleção → janela de recurso. Sem ação, o formulário de recurso
 *   fica aberto sem prazo (o cronograma sem ação é tratado como permissivo).
 *
 * Marco que já tem uma ação própria é respeitado. Módulo folha, sem banco.
 */

type Marco = Record<string, unknown>

const PUBLICACAO: AcaoJanela = 'PUBLICACAO_RESULTADO_PRELIMINAR'
const JANELAS_DE_RECURSO: AcaoJanela[] = ['RECURSO_RESULTADO_JANELA', 'RECURSO_RESULTADO_FINAL_JANELA']
/** Com a classificação gravada, quem recorre está em suplente ou desclassificado: fase do resultado final. */
const JANELA_PADRAO: AcaoJanela = 'RECURSO_RESULTADO_FINAL_JANELA'

const ROTULO_PUBLICACAO = /publica[çc][ãa]o dos projetos selecionados|resultado preliminar/i
const ROTULO_JANELA = /per[ií]odo para recursos\W+sele[çc][ãa]o/i

export const AVISO_SEM_CRONOGRAMA =
  'O edital não tem cronograma: o resultado abre na página pública, mas sem botão no cronograma e sem prazo para recurso.'
export const AVISO_SEM_MARCO_DE_PUBLICACAO =
  'O cronograma não tem o marco da publicação dos projetos selecionados: o resultado abre na página pública, mas o cronograma não ganha o botão da lista.'
export const AVISO_SEM_MARCO_DE_RECURSO =
  'O cronograma não tem o marco do período de recursos da seleção: o formulário de recurso fica sem prazo definido.'

export interface CronogramaDoPreliminar {
  cronograma: unknown
  avisos: string[]
}

function ehPersonalizado(marco: Marco): boolean {
  return marco !== null && typeof marco === 'object' && marco.tipo === 'custom'
}

/** Garante uma ação no marco: respeita a que já serve, senão liga o marco pelo rótulo. */
function ligarMarco(
  marcos: Marco[], servem: AcaoJanela[], rotulo: RegExp, acao: AcaoJanela,
): { marcos: Marco[]; achou: boolean } {
  if (marcos.some((m) => ehPersonalizado(m) && servem.includes(m.acao as AcaoJanela))) {
    return { marcos, achou: true }
  }
  const indice = marcos.findIndex(
    (m) => ehPersonalizado(m) && !m.acao && typeof m.label === 'string' && rotulo.test(m.label),
  )
  if (indice < 0) return { marcos, achou: false }
  return { marcos: marcos.map((m, i) => (i === indice ? { ...m, acao } : m)), achou: true }
}

export function marcarCronogramaDoPreliminar(cronograma: unknown): CronogramaDoPreliminar {
  if (!Array.isArray(cronograma)) return { cronograma, avisos: [AVISO_SEM_CRONOGRAMA] }

  const publicacao = ligarMarco(cronograma as Marco[], [PUBLICACAO], ROTULO_PUBLICACAO, PUBLICACAO)
  const janela = ligarMarco(publicacao.marcos, JANELAS_DE_RECURSO, ROTULO_JANELA, JANELA_PADRAO)

  const avisos: string[] = []
  if (!publicacao.achou) avisos.push(AVISO_SEM_MARCO_DE_PUBLICACAO)
  if (!janela.achou) avisos.push(AVISO_SEM_MARCO_DE_RECURSO)
  return { cronograma: janela.marcos, avisos }
}
