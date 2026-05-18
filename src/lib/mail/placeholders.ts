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
      { key: 'nome', description: 'Nome completo do proponente', sample: 'Ana Souza', required: true },
      { key: 'url', description: 'Link absoluto para a área do proponente', sample: 'https://culturaeturismo.irece.ba.gov.br/proponente', required: true },
    ],
  },
  comprovante_inscricao: {
    label: 'Comprovante de inscrição',
    description: 'Enviado quando uma inscrição é submetida com sucesso.',
    placeholders: [
      { key: 'numero', description: 'Número da inscrição', sample: 'INS-2026-001', required: true },
      { key: 'edital', description: 'Título do edital', sample: 'Edital PNAB Música 2026', required: true },
      { key: 'url', description: 'Link para acompanhamento da inscrição', sample: 'https://culturaeturismo.irece.ba.gov.br/proponente/inscricoes/abc', required: true },
    ],
  },
  resultado_preliminar: {
    label: 'Resultado preliminar publicado',
    description: 'Disparado quando o resultado preliminar do edital é publicado.',
    placeholders: [
      { key: 'edital', description: 'Título do edital', sample: 'Edital PNAB Música 2026', required: true },
      { key: 'url', description: 'Link para a página de resultados', sample: 'https://culturaeturismo.irece.ba.gov.br/editais/edital/resultados', required: true },
    ],
  },
  resultado_final: {
    label: 'Resultado final publicado',
    description: 'Disparado quando o resultado final do edital é publicado.',
    placeholders: [
      { key: 'edital', description: 'Título do edital', sample: 'Edital PNAB Música 2026', required: true },
      { key: 'url', description: 'Link para a página de resultados', sample: 'https://culturaeturismo.irece.ba.gov.br/editais/edital/resultados', required: true },
    ],
  },
  protocolo_atendimento: {
    label: 'Protocolo de atendimento',
    description: 'Confirmação de abertura de chamado/atendimento.',
    placeholders: [
      { key: 'protocolo', description: 'Número do protocolo gerado', sample: 'PROT-2026-12345', required: true },
    ],
  },
  notificacao_prazo: {
    label: 'Lembrete de prazo',
    description: 'Lembretes diversos (prazo de inscrição, anexo faltando, etc).',
    placeholders: [
      { key: 'mensagem', description: 'Texto principal do lembrete', sample: 'Sua inscrição no edital X vence em 24 horas.', required: true },
      { key: 'url', description: 'Link de retorno ao portal', sample: 'https://culturaeturismo.irece.ba.gov.br/proponente', required: true },
    ],
  },
  recuperacao_senha: {
    label: 'Recuperação de senha',
    description: 'Link único para redefinir senha (válido por 1 hora).',
    sensitive: true,
    placeholders: [
      { key: 'nome', description: 'Nome do usuário', sample: 'Ana Souza', required: true },
      { key: 'resetUrl', description: 'URL única de reset (token expira em 1h)', sample: 'https://culturaeturismo.irece.ba.gov.br/recuperar-senha/reset?token=abc123', required: true },
    ],
  },
  recurso_submetido: {
    label: 'Recurso submetido (interno)',
    description: 'Notifica a equipe quando um recurso é interposto.',
    placeholders: [
      { key: 'edital', description: 'Título do edital', sample: 'Edital PNAB Música 2026', required: true },
      { key: 'fase', description: 'Fase do recurso (HABILITACAO, RESULTADO_PRELIMINAR)', sample: 'Habilitação', required: true },
      { key: 'url', description: 'Link do painel admin pra analisar o recurso', sample: 'https://culturaeturismo.irece.ba.gov.br/admin/recursos/abc', required: true },
    ],
  },
  recurso_decidido: {
    label: 'Recurso analisado',
    description: 'Enviado ao proponente quando o recurso é decidido.',
    placeholders: [
      { key: 'edital', description: 'Título do edital', sample: 'Edital PNAB Música 2026', required: true },
      { key: 'decisao', description: 'Decisão (DEFERIDO ou INDEFERIDO)', sample: 'DEFERIDO', required: true },
      { key: 'url', description: 'Link para a área do proponente', sample: 'https://culturaeturismo.irece.ba.gov.br/proponente', required: true },
    ],
  },
  habilitacao: {
    label: 'Resultado da habilitação',
    description: 'Enviado quando a inscrição é habilitada ou inabilitada.',
    placeholders: [
      { key: 'nome', description: 'Nome do proponente', sample: 'Ana Souza', required: true },
      { key: 'numero', description: 'Número da inscrição', sample: 'INS-2026-001', required: true },
      { key: 'edital', description: 'Título do edital', sample: 'Edital PNAB Música 2026', required: true },
      { key: 'resultado', description: 'HABILITADA ou INABILITADA', sample: 'HABILITADA', required: true },
      { key: 'motivo', description: 'Motivo da inabilitação (opcional)', sample: 'Documentação incompleta.' },
      { key: 'url', description: 'Link para a área do proponente', sample: 'https://culturaeturismo.irece.ba.gov.br/proponente', required: true },
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
