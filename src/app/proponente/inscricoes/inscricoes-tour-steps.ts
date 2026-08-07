import type { TourStep } from '@/lib/tour/use-tour'

export const PASSOS_INSCRICOES: TourStep[] = [
  {
    elemento: '#tour-inscricoes-header',
    titulo: 'Minhas inscrições',
    descricao: 'Aqui fica tudo que você já inscreveu, em qualquer edital, com o total atualizado.',
  },
  {
    elemento: '#tour-inscricoes-filtros',
    titulo: 'Filtrar por status',
    descricao: 'Veja só os rascunhos, as inscrições em andamento, as contempladas ou as não contempladas.',
  },
  {
    elemento: '#tour-inscricoes-lista',
    titulo: 'Suas inscrições',
    descricao: 'Toque em qualquer inscrição pra ver detalhes completos, prazo de recurso e parecer da avaliação.',
  },
  {
    elemento: '#tour-inscricoes-carimbo',
    titulo: 'Carimbo de status',
    descricao: 'A cor e o texto mostram a situação atual: em andamento, habilitada, contemplada ou não contemplada.',
  },
  {
    elemento: '#tour-inscricoes-nova',
    titulo: 'Nova inscrição',
    descricao: 'Inicie uma inscrição em qualquer edital com vagas abertas.',
  },
  {
    elemento: '#tour-inscricoes-paginacao',
    titulo: 'Mais páginas',
    descricao: 'Se você tiver muitas inscrições, navegue entre as páginas por aqui.',
  },
  {
    elemento: '#tour-hamburguer',
    titulo: 'Seu menu',
    descricao: 'Toque aqui pra abrir o menu — dashboard, notificações e perfil ficam ali.',
    soMobile: true,
  },
]
