import type { TourStep } from '@/lib/tour/use-tour'

export const PASSOS_NOTIFICACOES: TourStep[] = [
  {
    elemento: '#tour-notificacoes-header',
    titulo: 'Notificações',
    descricao: 'Todos os avisos sobre suas inscrições e os editais, com o total de não lidas sempre visível.',
  },
  {
    elemento: '#tour-notificacoes-filtros',
    titulo: 'Filtrar notificações',
    descricao: 'Veja todas, só as não lidas ou só as que você já leu.',
  },
  {
    elemento: '#tour-notificacoes-lista',
    titulo: 'Seus avisos',
    descricao: 'Cada notificação mostra o que aconteceu e quando.',
  },
  {
    elemento: '#tour-notificacoes-item',
    titulo: 'Bolinha de não lida',
    descricao: 'A bolinha ao lado do título indica que você ainda não viu essa notificação.',
  },
  {
    elemento: '#tour-notificacoes-acoes-item',
    titulo: 'Ações da notificação',
    descricao: '"Acessar" leva direto pro assunto da notificação; "Marcar como lida" limpa só essa, sem precisar abrir.',
  },
  {
    elemento: '#tour-notificacoes-marcar-lidas',
    titulo: 'Marcar todas como lidas',
    descricao: 'Limpe os avisos pendentes de uma vez só.',
  },
  {
    elemento: '#tour-notificacoes-paginacao',
    titulo: 'Mais páginas',
    descricao: 'Se você tiver muitas notificações, navegue entre as páginas por aqui.',
  },
  {
    elemento: '#tour-hamburguer',
    titulo: 'Seu menu',
    descricao: 'Toque aqui pra abrir o menu — dashboard, inscrições e perfil ficam ali.',
    soMobile: true,
  },
]
