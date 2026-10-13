import type { TourStep } from '@/lib/tour/use-tour'

export const PASSOS_NOTIFICACOES: TourStep[] = [
  {
    elemento: '#tour-notificacoes-header',
    titulo: 'Notificações',
    descricao: 'Os avisos da Secretaria sobre suas inscrições e os editais, com quantos ainda não foram lidos.',
  },
  {
    elemento: '#tour-notificacoes-filtros',
    titulo: 'Filtrar avisos',
    descricao: 'Veja todos, só os que ainda não leu ou só os que já leu.',
  },
  {
    elemento: '#tour-notificacoes-lista',
    titulo: 'Avisos por dia',
    descricao: 'Os avisos ficam agrupados pelo dia em que chegaram, do mais recente ao mais antigo.',
  },
  {
    elemento: '#tour-notificacoes-item',
    titulo: 'Aviso novo',
    descricao: 'A marca "Novo" mostra o que você ainda não leu.',
  },
  {
    elemento: '#tour-notificacoes-acoes-item',
    titulo: 'Ações do aviso',
    descricao: 'O link leva direto ao assunto e já marca o aviso como lido. "Marcar como lido" limpa só esse, sem abrir.',
  },
  {
    elemento: '#tour-notificacoes-marcar-lidas',
    titulo: 'Marcar todos como lidos',
    descricao: 'Limpe os avisos novos de uma vez só.',
  },
  {
    elemento: '#tour-notificacoes-paginacao',
    titulo: 'Mais páginas',
    descricao: 'Se você tiver muitos avisos, navegue entre as páginas por aqui.',
  },
]
