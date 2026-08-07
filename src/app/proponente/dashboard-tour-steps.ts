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
    descricao: 'Os próximos encerramentos de inscrição que valem a pena acompanhar.',
  },
  {
    elemento: '#tour-inscricoes',
    titulo: 'Suas inscrições',
    descricao: 'O andamento de cada inscrição, com o carimbo da situação atual.',
  },
  {
    elemento: '#tour-rascunhos',
    titulo: 'Rascunhos pendentes',
    descricao: 'Inscrições que você começou mas ainda não enviou.',
  },
  {
    elemento: '#tour-notificacoes',
    titulo: 'Notificações',
    descricao: 'Os avisos mais recentes sobre suas inscrições e os editais.',
  },
  {
    elemento: '#tour-hamburguer',
    titulo: 'Seu menu',
    descricao: 'Toque aqui pra abrir o menu — suas inscrições, notificações e perfil ficam ali.',
    soMobile: true,
  },
  {
    elemento: '#tour-nav-dashboard',
    titulo: 'Dashboard',
    descricao: 'Esta tela — sua visão geral. É pra onde você volta sempre que entra.',
  },
  {
    elemento: '#tour-nav-inscricoes',
    titulo: 'Minhas Inscrições',
    descricao: 'Lista completa de tudo que você já inscreveu, em qualquer edital.',
  },
  {
    elemento: '#tour-nav-notificacoes',
    titulo: 'Notificações',
    descricao: 'Histórico completo de avisos, não só os mais recentes.',
  },
  {
    elemento: '#tour-nav-perfil',
    titulo: 'Meu Perfil',
    descricao: 'Seus dados de cadastro, pra manter tudo atualizado.',
  },
]
