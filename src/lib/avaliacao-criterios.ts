// Critérios padrão PNAB — utilizados quando o edital não configura critérios específicos
export const CRITERIOS_AVALIACAO_PADRAO = [
  {
    criterio: 'Relevância Cultural',
    peso: 25,
    descricao: 'Impacto e relevância do projeto para a cultura local e regional',
    notaMax: 10,
  },
  {
    criterio: 'Viabilidade Técnica',
    peso: 25,
    descricao: 'Capacidade técnica de execução e adequação dos recursos solicitados',
    notaMax: 10,
  },
  {
    criterio: 'Coerência do Plano de Trabalho',
    peso: 20,
    descricao: 'Clareza, consistência e detalhamento das ações propostas',
    notaMax: 10,
  },
  {
    criterio: 'Contrapartida Social',
    peso: 15,
    descricao: 'Benefício gerado para a comunidade e acessibilidade do projeto',
    notaMax: 10,
  },
  {
    criterio: 'Histórico do Proponente',
    peso: 15,
    descricao: 'Experiência comprovada e trajetória artístico-cultural',
    notaMax: 10,
  },
] as const

export type CriterioAvaliacao = {
  criterio: string
  peso: number
  descricao?: string
  notaMax: number
}
