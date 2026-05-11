export type LinkTarget =
  | { mode: 'NONE' }
  | { mode: 'MY_INSCRICOES' }
  | { mode: 'EDITAL' }
  | { mode: 'CUSTOM'; value: string }

export interface MessageTemplate {
  id: string
  label: string
  description: string
  titulo: string
  assunto: string
  corpo: string
  ctaLabel: string
  link: LinkTarget
}

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: 'BRANCO',
    label: 'Começar do zero',
    description: 'Mensagem em branco — você escreve tudo.',
    titulo: '',
    assunto: '',
    corpo: '',
    ctaLabel: '',
    link: { mode: 'NONE' },
  },
  {
    id: 'LEMBRETE_RASCUNHO',
    label: 'Lembrete: inscrição em rascunho',
    description: 'Para proponentes que começaram a inscrição mas não enviaram.',
    titulo: 'Lembrete de rascunho pendente',
    assunto: 'Sua inscrição ainda está como rascunho',
    corpo:
      'Olá! Identificamos que você começou uma inscrição em um dos editais do Portal PNAB Irecê, mas ainda não finalizou o envio.\n\n' +
      'Acesse sua área e finalize o envio antes do encerramento do prazo. Após o prazo, rascunhos não enviados não serão considerados.\n\n' +
      'Em caso de dúvida, entre em contato com a Secretaria de Arte e Cultura.',
    ctaLabel: 'Acessar minhas inscrições',
    link: { mode: 'MY_INSCRICOES' },
  },
  {
    id: 'HABILITACAO_PUBLICADA',
    label: 'Resultado de habilitação publicado',
    description: 'Avisa que a fase de habilitação foi divulgada.',
    titulo: 'Habilitação publicada',
    assunto: 'Resultado de habilitação publicado',
    corpo:
      'Olá! O resultado da fase de habilitação foi publicado. Acesse sua área no portal para verificar a situação da sua inscrição.\n\n' +
      'Caso sua inscrição tenha sido inabilitada, fique atento ao prazo para interposição de recurso, informado no edital.',
    ctaLabel: 'Ver minhas inscrições',
    link: { mode: 'MY_INSCRICOES' },
  },
  {
    id: 'RESULTADO_PRELIMINAR',
    label: 'Resultado preliminar',
    description: 'Notifica a publicação do resultado preliminar.',
    titulo: 'Resultado preliminar publicado',
    assunto: 'Resultado preliminar disponível',
    corpo:
      'Olá! O resultado preliminar foi publicado no Portal PNAB Irecê.\n\n' +
      'Acesse sua área para conferir sua classificação. O prazo para recurso está informado no edital.',
    ctaLabel: 'Ver resultado',
    link: { mode: 'MY_INSCRICOES' },
  },
  {
    id: 'RESULTADO_FINAL',
    label: 'Resultado final',
    description: 'Notifica a publicação do resultado final do edital.',
    titulo: 'Resultado final publicado',
    assunto: 'Resultado final disponível',
    corpo:
      'Olá! O resultado final do edital foi publicado.\n\n' +
      'Acesse sua área no Portal PNAB Irecê para conferir a classificação. Em caso de contemplação, acompanhe as próximas etapas conforme o edital.',
    ctaLabel: 'Ver resultado',
    link: { mode: 'MY_INSCRICOES' },
  },
  {
    id: 'EDITAL_NOVO',
    label: 'Edital novo aberto',
    description: 'Anuncia a abertura de um novo edital. Escolha o edital no picker abaixo.',
    titulo: 'Novo edital publicado',
    assunto: 'Novo edital aberto para inscrições',
    corpo:
      'Olá! A Secretaria de Arte e Cultura de Irecê publicou um novo edital no Portal PNAB.\n\n' +
      'Confira as regras de elegibilidade, o cronograma e os documentos necessários. Inscrições abertas pelo portal.',
    ctaLabel: 'Conhecer o edital',
    link: { mode: 'EDITAL' },
  },
  {
    id: 'AVISO_GERAL',
    label: 'Aviso geral da Secretaria',
    description: 'Comunicado institucional sem ação obrigatória.',
    titulo: 'Aviso da Secretaria de Arte e Cultura',
    assunto: 'Aviso da Secretaria',
    corpo:
      'Olá! A Secretaria de Arte e Cultura de Irecê comunica:\n\n' +
      '[escreva aqui o conteúdo do aviso]',
    ctaLabel: '',
    link: { mode: 'NONE' },
  },
]
