import { QUESTIONARIO_VAZIO, type ValoresQuestionario } from './valores'

/**
 * Pontos de partida para "Novo questionário". Só preenchem o formulário: nada
 * é gravado até a pessoa salvar, e tudo pode ser trocado antes disso.
 */
export interface Modelo {
  chave: string
  titulo: string
  resumo: string
  valores: ValoresQuestionario
}

const NOTAS = ['Ótima', 'Boa', 'Regular', 'Ruim']

export const MODELOS: Modelo[] = [
  {
    chave: 'satisfacao',
    titulo: 'Pesquisa de satisfação da visita',
    resumo: 'Nota da visita, o que mais gostou e sugestões. Para enviar depois da visita.',
    valores: {
      ...QUESTIONARIO_VAZIO,
      titulo: 'Como foi sua visita ao Memorial?',
      slug: 'pesquisa-visita-memorial',
      finalidade: 'memorial-pesquisa-visitante',
      descricao: 'Leva menos de dois minutos. Sua resposta ajuda a equipe a melhorar as próximas visitas.',
      mensagemSucesso: 'Obrigado por contar como foi. Volte sempre ao Memorial de Irecê.',
      campos: [
        { nome: 'avaliacao_geral', label: 'Como você avalia a visita?', tipo: 'select', obrigatorio: true, opcoes: NOTAS },
        { nome: 'mais_gostou', label: 'O que você mais gostou?', tipo: 'textarea', obrigatorio: false },
        { nome: 'recomendaria', label: 'Recomendaria o Memorial a outras pessoas?', tipo: 'select', obrigatorio: true, opcoes: ['Sim', 'Talvez', 'Não'] },
        { nome: 'sugestoes', label: 'Tem alguma sugestão para a equipe?', tipo: 'textarea', obrigatorio: false },
      ],
    },
  },
  {
    chave: 'agendamento',
    titulo: 'Perguntas extras do agendamento',
    resumo: 'Entram no pedido de visita: quem é o grupo, idades e necessidades de acessibilidade.',
    valores: {
      ...QUESTIONARIO_VAZIO,
      titulo: 'Sobre o grupo da visita',
      slug: 'perguntas-agendamento-memorial',
      finalidade: 'memorial-agendamento',
      campos: [
        { nome: 'tipo_grupo', label: 'Que tipo de grupo vem?', tipo: 'select', obrigatorio: true, opcoes: ['Escola', 'Família', 'Grupo de amigos', 'Instituição', 'Outro'] },
        { nome: 'faixa_etaria', label: 'Idade da maioria do grupo', tipo: 'select', obrigatorio: false, opcoes: ['Crianças', 'Adolescentes', 'Adultos', 'Pessoas idosas', 'Idades variadas'] },
        { nome: 'acessibilidade', label: 'Alguém precisa de apoio de acessibilidade?', tipo: 'textarea', obrigatorio: false, hint: 'Cadeira de rodas, intérprete de Libras, audiodescrição...' },
      ],
    },
  },
]

export function modeloPorChave(chave: string | undefined): Modelo | undefined {
  return MODELOS.find((m) => m.chave === chave)
}
