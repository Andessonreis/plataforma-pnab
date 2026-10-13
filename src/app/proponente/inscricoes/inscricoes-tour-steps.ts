import type { TourStep } from '@/lib/tour/use-tour'

export const PASSOS_INSCRICOES: TourStep[] = [
  {
    elemento: '#tour-inscricoes-header',
    titulo: 'Minhas inscrições',
    descricao: 'Tudo o que você inscreveu, em qualquer edital, com a situação de cada uma.',
  },
  {
    elemento: '#tour-inscricoes-filtros',
    titulo: 'Filtrar por situação',
    descricao: 'Veja só os rascunhos, as que estão em andamento ou as que já têm resultado.',
  },
  {
    elemento: '#tour-inscricoes-carimbo',
    titulo: 'Situação',
    descricao: 'O carimbo diz em que fase a inscrição está; a frase ao lado explica o que isso quer dizer.',
  },
  {
    elemento: '#tour-inscricoes-acao',
    titulo: 'Próximo passo',
    descricao: 'Aqui fica o que você pode fazer agora: continuar um rascunho, enviar recurso ou ver o resultado. Quando há prazo, ele aparece logo acima.',
  },
  {
    elemento: '#tour-inscricoes-lista',
    titulo: 'Detalhes',
    descricao: 'Toque no nome do edital para ver a inscrição completa, os pareceres e os documentos.',
  },
  {
    elemento: '#tour-inscricoes-nova',
    titulo: 'Nova inscrição',
    descricao: 'Para se inscrever em outro edital, abra a lista de editais e escolha um com inscrições abertas.',
  },
  {
    elemento: '#tour-inscricoes-paginacao',
    titulo: 'Mais páginas',
    descricao: 'Se você tiver muitas inscrições, navegue entre as páginas por aqui.',
  },
]
