import type { UserRole } from '@prisma/client'

/**
 * Papéis cuja tela o SUPER_ADMIN pode acompanhar como se fosse o usuário.
 * Coincidem com `FuncaoEdital`, então o mesmo nome serve para achar a equipe
 * do edital em que o usuário está.
 */
export type PapelEspelho = Extract<UserRole, 'AVALIADOR' | 'HABILITADOR'>

interface ConfigEspelho {
  /** Como a interface chama o papel ("avaliador", "habilitador"). */
  rotulo: string
  cookie: string
  /** Rota até onde o cookie vale, para o espelho não vazar para o resto do sistema. */
  caminho: string
  /** Tela em que o SUPER_ADMIN escolhe quem acompanhar. */
  escolha: string
  /** Para onde vai depois de escolher. */
  destino: string
  /** Para onde vai ao sair do espelho. */
  saida: string
  /** Para onde vão os perfis que não podem usar o espelho. */
  inicio: string
  /** Texto do usuário que não está na equipe de nenhum edital. */
  semEquipe: string
}

export const ESPELHO: Record<PapelEspelho, ConfigEspelho> = {
  AVALIADOR: {
    rotulo: 'avaliador',
    cookie: 'pnab.espelho-avaliador',
    caminho: '/avaliador',
    escolha: '/avaliador/espelho',
    destino: '/avaliador/recursos',
    saida: '/admin',
    inicio: '/avaliador/inscricoes',
    semEquipe: 'Não está na equipe de nenhum edital',
  },
  HABILITADOR: {
    rotulo: 'habilitador',
    cookie: 'pnab.espelho-habilitador',
    caminho: '/admin/habilitacao',
    escolha: '/admin/habilitacao/espelho',
    destino: '/admin/habilitacao',
    saida: '/admin/habilitacao',
    inicio: '/admin/habilitacao',
    semEquipe: 'Sem equipe própria: vê só os editais que não têm equipe de habilitação',
  },
}

/** Duração do modo espelho; depois disso o SUPER_ADMIN escolhe de novo. */
export const DURACAO_ESPELHO_SEGUNDOS = 60 * 60 * 4

/** Valida o papel vindo de formulário, que o cliente pode adulterar. */
export function papelEspelho(valor: unknown): PapelEspelho | null {
  return valor === 'AVALIADOR' || valor === 'HABILITADOR' ? valor : null
}
