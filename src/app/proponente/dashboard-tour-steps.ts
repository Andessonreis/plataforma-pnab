import type { TourStep } from '@/lib/tour/use-tour'

export const PASSOS_DASHBOARD: TourStep[] = [
  {
    elemento: '#tour-cta-principal',
    titulo: 'Sua ação mais urgente',
    descricao: 'Este botão muda sozinho pra mostrar o que mais importa agora: um prazo próximo, um rascunho pendente ou um edital novo.',
  },
  {
    elemento: '#tour-cta-inscricoes',
    titulo: 'Minhas inscrições',
    descricao: 'Atalho direto pra lista completa das suas inscrições.',
  },
  {
    elemento: '#tour-prazos',
    titulo: 'Prazos em aberto',
    descricao: 'Os encerramentos que vêm a seguir nos editais com inscrições abertas.',
  },
  {
    elemento: '#tour-inscricoes',
    titulo: 'Suas inscrições',
    descricao: 'O andamento de cada inscrição, com o carimbo da situação atual.',
  },
  {
    elemento: '#tour-rascunhos',
    titulo: 'Rascunhos',
    descricao: 'Inscrições que você começou mas ainda não enviou.',
  },
  {
    elemento: '#tour-notificacoes',
    titulo: 'Avisos',
    descricao: 'Os avisos mais recentes sobre suas inscrições e os editais.',
  },
  {
    elemento: '#tour-memorial',
    titulo: 'Memorial de Irecê',
    descricao: 'Peça uma visita guiada ao Memorial e acompanhe aqui a resposta da equipe.',
  },
  {
    elemento: '#tour-menu',
    titulo: 'Seu menu',
    descricao: 'Suas inscrições, avisos, visitas ao Memorial e perfil ficam aqui, a um toque de distância.',
  },
  {
    elemento: '#tour-nav-dashboard',
    titulo: 'Início',
    descricao: 'Esta tela, a visão geral. É pra onde você volta sempre que entra.',
  },
  {
    elemento: '#tour-nav-inscricoes',
    titulo: 'Minhas inscrições',
    descricao: 'Lista completa de tudo que você já inscreveu, em qualquer edital.',
  },
  {
    elemento: '#tour-nav-notificacoes',
    titulo: 'Notificações',
    descricao: 'Histórico completo de avisos, não só os mais recentes.',
  },
  {
    elemento: '#tour-nav-perfil',
    titulo: 'Meu perfil',
    descricao: 'Seus dados de cadastro, pra manter tudo atualizado.',
  },
]
