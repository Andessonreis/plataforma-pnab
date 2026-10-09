// Placeholders dos e-mails do agendamento de visitas do Memorial (somados em placeholders.ts).

import type { PlaceholderSpec, TemplateMeta } from './placeholders'
import type { MemorialEmailTemplate } from './templates/memorial'

const VISITA: PlaceholderSpec[] = [
  { key: 'protocolo', description: 'Protocolo do pedido de visita.', sample: 'MEM-2026-A1B2C3', required: true },
  { key: 'data', description: 'Data da visita, por extenso.', sample: 'sexta-feira, 9 de outubro de 2026', required: true },
  { key: 'horario', description: 'Faixa de horário da visita.', sample: '09:00 às 09:45', required: true },
  { key: 'instituicao', description: 'Instituição ou nome do grupo.', sample: 'Escola Municipal Rui Barbosa', required: true },
  { key: 'quantidade', description: 'Quantidade de pessoas no grupo.', sample: '18', required: true },
]

const NOME: PlaceholderSpec = { key: 'nome', description: 'Nome do responsável pelo grupo.', sample: 'Ana Souza', required: true }
const CONTATO: PlaceholderSpec = { key: 'contatoEmail', description: 'E-mail de contato do Memorial (configuração).', sample: 'memorialirececsj@gmail.com' }

export const TEMPLATE_META_MEMORIAL: Record<MemorialEmailTemplate, TemplateMeta> = {
  memorial_solicitacao_recebida: {
    label: 'Memorial — pedido de visita recebido',
    description: 'Enviado ao responsável logo após pedir uma visita. Avisa que ainda não está confirmada.',
    placeholders: [
      NOME,
      ...VISITA,
      { key: 'aviso', description: 'Texto de "solicitação recebida" definido nas configurações do Memorial.', sample: 'Sua visita ainda NÃO está confirmada.', required: true },
      CONTATO,
    ],
  },
  memorial_visita_confirmada: {
    label: 'Memorial — visita confirmada ou remarcada',
    description: 'Enviado quando a equipe confirma a visita ou muda a data/horário.',
    placeholders: [NOME, ...VISITA, CONTATO],
  },
  memorial_visita_recusada: {
    label: 'Memorial — visita recusada ou cancelada',
    description: 'Enviado quando a equipe recusa um pedido ou cancela uma visita, com o motivo.',
    placeholders: [
      NOME,
      ...VISITA,
      { key: 'situacao', description: 'RECUSADA ou CANCELADA.', sample: 'RECUSADA', required: true },
      { key: 'motivo', description: 'Motivo informado pela equipe.', sample: 'O Memorial estará fechado para manutenção nesta data.', required: true },
      CONTATO,
    ],
  },
  memorial_nova_solicitacao: {
    label: 'Memorial — novo pedido de visita (interno)',
    description: 'Alerta para a equipe de Comunicação e o e-mail do Memorial a cada novo pedido.',
    placeholders: [
      { key: 'nomeDestinatario', description: 'Nome de quem recebe o alerta.', sample: 'Equipe do Memorial', required: true },
      ...VISITA,
      { key: 'tipoVisitante', description: 'Tipo de visitante informado no pedido.', sample: 'Unidade Escolar Municipal', required: true },
      { key: 'url', description: 'Link do pedido no painel.', sample: 'https://culturaeturismo.irece.ba.gov.br/admin/memorial/agendamentos/abc', required: true },
    ],
  },
}
