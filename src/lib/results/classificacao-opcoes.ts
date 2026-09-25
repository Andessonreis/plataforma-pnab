import type { Edital } from '@prisma/client'
import type { CategoriaConfig } from '@/types/categoria-config'
import type { MontarClassificacaoOptions } from './classificacao'

/** Campos do edital que definem como a classificação é calculada. */
export type EditalParaClassificacao = Pick<
  Edital,
  'vagasSuplentes' | 'notaMinima' | 'categoriasConfig' | 'bonusVisivelParaAdmin'
>

/**
 * A bonificação só entra na nota de quem pode vê-la: o SUPER_ADMIN sempre, os
 * demais só depois de a Secretaria liberar o painel. Tela, PDF de classificação
 * e lote de projetos decidem por aqui para nunca divergirem entre si.
 */
export function bonusVisivelPara(role: string, edital: Pick<Edital, 'bonusVisivelParaAdmin'>): boolean {
  return role === 'SUPER_ADMIN' || edital.bonusVisivelParaAdmin
}

/** Converte os campos do edital nas opções de `montarClassificacao`. */
export function opcoesDaClassificacao(
  edital: Omit<EditalParaClassificacao, 'bonusVisivelParaAdmin'>,
  incluirBonus: boolean,
): MontarClassificacaoOptions {
  return {
    incluirBonus,
    notaMinima: edital.notaMinima != null ? Number(edital.notaMinima) : null,
    maxSuplentes: edital.vagasSuplentes,
    categoriasConfig: Array.isArray(edital.categoriasConfig)
      ? (edital.categoriasConfig as unknown as CategoriaConfig[])
      : null,
  }
}
