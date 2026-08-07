import type { TourStep } from '@/lib/tour/use-tour'

export const PASSOS_DETALHE_INSCRICAO: TourStep[] = [
  {
    elemento: '#tour-detalhe-timeline',
    titulo: 'Andamento da inscrição',
    descricao: 'A etapa atual do processo, do envio até o resultado final.',
  },
  {
    elemento: '#tour-detalhe-info',
    titulo: 'Informações gerais',
    descricao: 'Número do processo, categoria e data de envio da sua inscrição.',
  },
  {
    elemento: '#tour-detalhe-dados',
    titulo: 'Dados enviados',
    descricao: 'Toque em cada seção pra abrir e conferir tudo o que foi enviado: seus dados, o projeto e cada etapa do formulário.',
  },
  {
    elemento: '#tour-detalhe-anexos',
    titulo: 'Anexos',
    descricao: 'Os arquivos enviados na inscrição, com a validação de cada um.',
  },
  {
    elemento: '#tour-detalhe-documentos',
    titulo: 'Documentos pra baixar',
    descricao: 'Comprovante de inscrição e o projeto completo, prontos em PDF.',
  },
  {
    elemento: '#tour-detalhe-acoes',
    titulo: 'Ações',
    descricao: 'Volte pra lista ou, se a inscrição ainda permitir, edite ou retire pra corrigir algo.',
  },
  {
    elemento: '#tour-hamburguer',
    titulo: 'Seu menu',
    descricao: 'Toque aqui pra abrir o menu — dashboard, notificações e perfil ficam ali.',
    soMobile: true,
  },
]
