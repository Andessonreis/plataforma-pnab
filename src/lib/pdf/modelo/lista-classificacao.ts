/**
 * Conteúdo da classificação por categoria que as duas versões de layout
 * escrevem do mesmo jeito: rótulos de situação, quadro de vagas e textos de
 * fechamento. Sem PDFKit.
 */
import type { SituacaoClassificacao } from '@/lib/documentos/titulos'
import type { CategoriaClassificacao, LinhaClassificacao } from './tipos'

export const SITUACAO_DA_LINHA: Record<LinhaClassificacao['status'], string> = {
  CONTEMPLADA: 'Classificado',
  SUPLENTE: 'Suplente',
  NAO_CONTEMPLADA: 'Desclassificado',
  NAO_SE_APLICA: 'Não se aplica',
}

export const AVISO_PREVIA =
  'Documento de trabalho — não publicar. A conferência da bonificação e o lançamento de notas podem '
  + 'estar em andamento, portanto esta classificação pode mudar. Nenhum resultado foi consolidado no sistema.'

/** Aviso que fecha o documento e situação impressa no protocolo, por estado da classificação. */
export const TEXTOS_POR_SITUACAO: Record<SituacaoClassificacao, { rodape: string; situacao: string }> = {
  PREVIA: {
    rodape:
      'Prévia de conferência gerada pela plataforma Portal PNAB Irecê. Não constitui resultado '
      + 'e não deve ser publicada nem compartilhada fora da Secretaria.',
    situacao: 'Prévia — não publicável',
  },
  CONSOLIDADA: {
    rodape:
      'Classificação consolidada no sistema da plataforma Portal PNAB Irecê, conforme as notas '
      + 'lançadas pela comissão avaliadora e a bonificação prevista no edital.',
    situacao: 'Resultado consolidado',
  },
  FINAL: {
    rodape:
      'Resultado final consolidado no sistema da plataforma Portal PNAB Irecê, após o julgamento dos '
      + 'recursos, conforme as notas lançadas pela comissão avaliadora e a bonificação prevista no edital.',
    situacao: 'Resultado final após recursos',
  },
}

/** Linha sem posição nem nota: sem avaliação finalizada ou fora da classificação. */
export function semNota(linha: LinhaClassificacao): boolean {
  return linha.semAvaliacao || linha.status === 'NAO_SE_APLICA'
}

function brl(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** Vagas e valor da categoria, na linha que abre a tabela dela. */
export function descreverQuadroVagas(
  categoria: Pick<CategoriaClassificacao, 'vagasAmplaConcorrencia' | 'cotas' | 'valorPorProjeto'>,
): string {
  const cotas = categoria.cotas
    .filter((cota) => cota.vagas > 0)
    .map((cota) => `${cota.label}: ${cota.vagas}`)
    .join(' · ')

  return [
    `${categoria.vagasAmplaConcorrencia ?? '—'} vaga(s) de ampla concorrência`,
    cotas || 'sem cota reservada',
    categoria.valorPorProjeto ? `${brl(categoria.valorPorProjeto)} por projeto` : null,
  ].filter(Boolean).join(' · ')
}
