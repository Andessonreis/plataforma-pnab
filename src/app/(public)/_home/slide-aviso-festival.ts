import type { SlideArte } from '@/components/home/types'

/**
 * Último instante em que o aviso das datas do Festival ainda aparece na
 * abertura: fim do dia 27/02/2027 em Brasília (UTC-3). Depois disso o slide
 * sai sozinho, sem precisar de novo deploy.
 */
export const AVISO_FESTIVAL_EXPIRA_EM = new Date('2027-02-27T23:59:59-03:00')

/**
 * Comunicado da Secretaria com as datas do Festival de Arte e Cultura de
 * Irecê (18 a 27/02/2027). Arte fechada, exibida inteira no quadro.
 */
export const SLIDE_AVISO_FESTIVAL: SlideArte = {
  tipo: 'arte',
  id: 'aviso-festival-datas-2027',
  titulo:
    'Atenção, agentes culturais! O Festival de Arte e Cultura de Irecê - Centenário da Cidade será realizado de 18 a 27 de fevereiro de 2027.',
  imagemUrl: '/images/avisos/festival-datas-2027.jpeg',
  ctaLabel: 'Ver editais',
  ctaUrl: '/editais',
}
