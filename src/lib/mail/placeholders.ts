// Catálogo de placeholders por template — guia a UI do editor e o preview
// com dados de exemplo. Mantém em sync com os campos de `TemplateDataMap`.

import type { EmailTemplate } from './templates'

export interface PlaceholderSpec {
  key: string
  description: string
  sample: string
  required?: boolean
}

export interface TemplateMeta {
  /** Rótulo amigável pra UI. */
  label: string
  /** Resumo curto do quando esse e-mail é disparado. */
  description: string
  /** `true` = transacional crítico; UI alerta antes de habilitar override. */
  sensitive?: boolean
  placeholders: PlaceholderSpec[]
}

export const TEMPLATE_META: Record<EmailTemplate, TemplateMeta> = {
  boas_vindas: {
    label: 'Boas-vindas',
    description: 'Disparado após cadastro de novo proponente.',
    placeholders: [
      { key: 'nome', description: 'Nome completo do proponente recém-cadastrado.', sample: 'Ana Souza', required: true },
      { key: 'url', description: 'Link da área do proponente — o sistema preenche com a URL exata.', sample: 'https://culturaeturismo.irece.ba.gov.br/proponente', required: true },
    ],
  },
  comprovante_inscricao: {
    label: 'Comprovante de inscrição',
    description: 'Enviado quando uma inscrição é submetida com sucesso.',
    placeholders: [
      { key: 'numero', description: 'Número da inscrição específica do destinatário (ex: INS-2026-001).', sample: 'INS-2026-001', required: true },
      { key: 'edital', description: 'Título do edital onde o destinatário se inscreveu — varia conforme o edital.', sample: 'Edital PNAB Música 2026', required: true },
      { key: 'url', description: 'Link direto pra acompanhar a inscrição do destinatário no portal.', sample: 'https://culturaeturismo.irece.ba.gov.br/proponente/inscricoes/abc', required: true },
    ],
  },
  resultado_preliminar: {
    label: 'Resultado preliminar publicado',
    description: 'Disparado quando o resultado preliminar do edital é publicado.',
    placeholders: [
      { key: 'edital', description: 'Título do edital cujo resultado foi publicado.', sample: 'Edital PNAB Música 2026', required: true },
      { key: 'url', description: 'Link pra página pública de resultados do edital.', sample: 'https://culturaeturismo.irece.ba.gov.br/editais/edital/resultados', required: true },
    ],
  },
  resultado_final: {
    label: 'Resultado final publicado',
    description: 'Disparado quando o resultado final do edital é publicado.',
    placeholders: [
      { key: 'edital', description: 'Título do edital cujo resultado final foi publicado.', sample: 'Edital PNAB Música 2026', required: true },
      { key: 'url', description: 'Link pra página pública de resultados do edital.', sample: 'https://culturaeturismo.irece.ba.gov.br/editais/edital/resultados', required: true },
    ],
  },
  protocolo_atendimento: {
    label: 'Protocolo de atendimento',
    description: 'Confirmação de abertura de chamado/atendimento.',
    placeholders: [
      { key: 'protocolo', description: 'Número do protocolo gerado pra esse atendimento específico.', sample: 'PROT-2026-12345', required: true },
    ],
  },
  atendimento_respondido: {
    label: 'Resposta de atendimento',
    description: 'Enviado ao autor do atendimento quando a equipe responde.',
    placeholders: [
      { key: 'nomeContato', description: 'Nome de quem abriu o atendimento.', sample: 'Ana Souza', required: true },
      { key: 'protocolo', description: 'Número do protocolo do atendimento respondido.', sample: 'PROT-2026-12345', required: true },
      { key: 'assunto', description: 'Assunto original do atendimento.', sample: 'Dúvida sobre documentação', required: true },
      { key: 'resposta', description: 'Texto da resposta da equipe.', sample: 'Segue esclarecimento sobre sua dúvida...', required: true },
    ],
  },
  notificacao_prazo: {
    label: 'Lembrete de prazo',
    description: 'Lembretes diversos (prazo de inscrição, anexo faltando, etc).',
    placeholders: [
      { key: 'mensagem', description: 'Texto principal do lembrete — definido pela campanha/regra que disparou.', sample: 'Sua inscrição no edital X vence em 24 horas.', required: true },
      { key: 'url', description: 'Link de retorno ao portal — varia conforme o lembrete (área do proponente, página da inscrição, etc.).', sample: 'https://culturaeturismo.irece.ba.gov.br/proponente', required: true },
    ],
  },
  recuperacao_senha: {
    label: 'Recuperação de senha',
    description: 'Link único para redefinir senha (válido por 1 hora).',
    sensitive: true,
    placeholders: [
      { key: 'nome', description: 'Nome do usuário que pediu recuperação de senha.', sample: 'Ana Souza', required: true },
      { key: 'resetUrl', description: 'URL ÚNICA pra esse usuário redefinir a senha (token expira em 1h). SEM esse atalho no texto, ninguém consegue recuperar.', sample: 'https://culturaeturismo.irece.ba.gov.br/recuperar-senha/reset?token=abc123', required: true },
    ],
  },
  recurso_submetido: {
    label: 'Recurso submetido (interno)',
    description: 'Notifica a equipe quando um recurso é interposto.',
    placeholders: [
      { key: 'edital', description: 'Título do edital onde o recurso foi interposto.', sample: 'Edital PNAB Música 2026', required: true },
      { key: 'fase', description: 'Fase do recurso (Habilitação, Resultado Preliminar, etc).', sample: 'Habilitação', required: true },
      { key: 'url', description: 'Link do painel admin pra analisar esse recurso específico.', sample: 'https://culturaeturismo.irece.ba.gov.br/admin/recursos/abc', required: true },
    ],
  },
  recurso_decidido: {
    label: 'Recurso analisado',
    description: 'Enviado ao proponente quando o recurso é decidido.',
    placeholders: [
      { key: 'nome', description: 'Nome do proponente destinatário.', sample: 'Ana Souza', required: true },
      { key: 'numero', description: 'Número da inscrição específica do destinatário.', sample: 'INS-2026-001', required: true },
      { key: 'edital', description: 'Título do edital onde o recurso foi interposto.', sample: 'Edital PNAB Música 2026', required: true },
      { key: 'decisao', description: 'Decisão do recurso (DEFERIDO ou INDEFERIDO) — varia por destinatário.', sample: 'DEFERIDO', required: true },
      { key: 'justificativa', description: 'Justificativa da decisão, quando houver.', sample: 'Documentação regularizada no prazo.' },
      { key: 'url', description: 'Link da inscrição na área do proponente pra ver os detalhes.', sample: 'https://culturaeturismo.irece.ba.gov.br/proponente/inscricoes/abc', required: true },
    ],
  },
  habilitacao: {
    label: 'Resultado da habilitação',
    description: 'Enviado quando a inscrição é habilitada ou inabilitada.',
    placeholders: [
      { key: 'nome', description: 'Nome do proponente destinatário.', sample: 'Ana Souza', required: true },
      { key: 'numero', description: 'Número da inscrição específica do destinatário.', sample: 'INS-2026-001', required: true },
      { key: 'edital', description: 'Título do edital onde o destinatário se inscreveu.', sample: 'Edital PNAB Música 2026', required: true },
      { key: 'resultado', description: 'HABILITADA ou INABILITADA — varia conforme a decisão sobre o destinatário.', sample: 'HABILITADA', required: true },
      { key: 'motivo', description: 'Motivo da inabilitação (preenchido só quando o resultado é INABILITADA).', sample: 'Documentação incompleta.' },
      { key: 'url', description: 'Link da área do proponente.', sample: 'https://culturaeturismo.irece.ba.gov.br/proponente', required: true },
    ],
  },
  equipe_habilitacao_pendente: {
    label: 'Habilitação pendente (equipe)',
    description: 'Lembrete interno disparado quando um edital entra na fase de habilitação — vai pros admins ativos.',
    placeholders: [
      { key: 'nomeAdmin', description: 'Nome do administrador destinatário.', sample: 'Maria Silva', required: true },
      { key: 'editalTitulo', description: 'Título do edital cuja habilitação foi aberta.', sample: 'Chamamento Público — Pontos de Cultura de Irecê', required: true },
      { key: 'editalAno', description: 'Ano do edital.', sample: '2026', required: true },
      { key: 'inscricoesPendentes', description: 'Quantas inscrições estão aguardando análise no momento do disparo.', sample: '3', required: true },
      { key: 'url', description: 'Link direto pro painel de habilitação no admin.', sample: 'https://culturaeturismo.irece.ba.gov.br/admin/habilitacao', required: true },
    ],
  },
  notificacao_generica: {
    label: 'Notificação genérica (campanhas)',
    description: 'Usado pelas campanhas em /admin/notificacoes — corpo HTML autoral.',
    placeholders: [
      { key: 'titulo', description: 'Título grande no topo', sample: 'Atualização sobre o edital', required: true },
      { key: 'corpo', description: 'Corpo HTML da mensagem', sample: '<p>Olá! Lembramos que...</p>', required: true },
      { key: 'nome', description: 'Nome do destinatário (opcional)', sample: 'Ana' },
      { key: 'link', description: 'URL do botão CTA (opcional)', sample: 'https://culturaeturismo.irece.ba.gov.br/' },
      { key: 'ctaLabel', description: 'Texto do botão CTA (opcional)', sample: 'Saber mais' },
    ],
  },
  relatorio_inscricoes: {
    label: 'Relatório de inscrições',
    description: 'Enviado pela equipe, sob demanda, com os PDFs de inscrições por edital em anexo.',
    placeholders: [
      { key: 'nome', description: 'Nome de quem recebe o relatório (membro da equipe da Secretaria).', sample: 'Malane Apolonio', required: true },
      { key: 'statusLabel', description: 'Status filtrado no relatório — muda conforme o recorte escolhido na exportação.', sample: 'Rascunho', required: true },
      { key: 'dataGeracao', description: 'Data em que o relatório foi gerado, já formatada em pt-BR.', sample: '26/08/2026', required: true },
      { key: 'total', description: 'Total de inscrições somando todos os PDFs em anexo.', sample: '61', required: true },
      { key: 'areaLabel', description: 'Área/categoria filtrada, quando o relatório for de uma área só. Vazio = todas as áreas.', sample: 'Teatro' },
      { key: 'url', description: 'Link de volta pra tela de exportação no painel.', sample: 'https://culturaeturismo.irece.ba.gov.br/admin/inscricoes/export' },
    ],
  },
  edital_inscricao_encerrada: {
    label: 'Inscrição encerrada (equipe)',
    description: 'Disparado automaticamente quando um edital sai da fase de inscrições abertas — vai pros admins ativos, com as listas de enviadas e rascunhos em anexo.',
    placeholders: [
      { key: 'nomeAdmin', description: 'Nome do administrador destinatário.', sample: 'Maria Silva', required: true },
      { key: 'editalTitulo', description: 'Título do edital cuja inscrição encerrou.', sample: 'Chamamento Público — Pontos de Cultura de Irecê', required: true },
      { key: 'editalAno', description: 'Ano do edital.', sample: '2026', required: true },
      { key: 'totalEnviadas', description: 'Total de inscrições enviadas — seguem pra habilitação.', sample: '42', required: true },
      { key: 'totalRascunhos', description: 'Total de rascunhos não enviados até o encerramento.', sample: '5', required: true },
      { key: 'dataGeracao', description: 'Data de encerramento/geração das listas, já formatada em pt-BR.', sample: '02/09/2026', required: true },
      { key: 'url', description: 'Link direto pro painel de habilitação no admin.', sample: 'https://culturaeturismo.irece.ba.gov.br/admin/habilitacao', required: true },
    ],
  },
}

// Monta um objeto data com os valores `sample` — usado pelo preview do admin.
export function getSampleData(template: EmailTemplate): Record<string, string> {
  const meta = TEMPLATE_META[template]
  const data: Record<string, string> = {}
  for (const p of meta.placeholders) {
    data[p.key] = p.sample
  }
  return data
}
