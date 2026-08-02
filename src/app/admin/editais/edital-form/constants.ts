import type { TipoProponente } from '@prisma/client'

export const TIPO_PROPONENTE_OPTIONS: { value: TipoProponente; label: string }[] = [
  { value: 'PF', label: 'Pessoa Física' },
  { value: 'MEI', label: 'MEI' },
  { value: 'PJ', label: 'Pessoa Jurídica' },
  { value: 'COLETIVO', label: 'Coletivo' },
]

export const STATUS_OPTIONS = [
  { value: 'RASCUNHO', label: 'Rascunho' },
  { value: 'PUBLICADO', label: 'Publicado' },
  { value: 'INSCRICOES_ABERTAS', label: 'Inscrições Abertas' },
  { value: 'INSCRICOES_ENCERRADAS', label: 'Inscrições Encerradas' },
  { value: 'HABILITACAO', label: 'Habilitação' },
  { value: 'AVALIACAO', label: 'Avaliação' },
  { value: 'RESULTADO_PRELIMINAR', label: 'Resultado Preliminar' },
  { value: 'RECURSO', label: 'Recurso' },
  { value: 'RESULTADO_FINAL', label: 'Resultado Final' },
  { value: 'ENCERRADO', label: 'Encerrado' },
]

const currentYear = new Date().getFullYear()
export const ANO_OPTIONS = Array.from({ length: 6 }, (_, i) => {
  const y = currentYear - 1 + i
  return { value: String(y), label: String(y) }
})

export const TEMPLATE_REGRAS = [
  '• Ser pessoa física ou jurídica residente ou com sede no município de Irecê/BA',
  '• Possuir CPF ou CNPJ ativo e regular',
  '• Não estar inscrito em cadastros de inadimplentes (CADIN, SPC, Serasa)',
  '• Estar em dia com obrigações tributárias municipais, estaduais e federais',
  '• Não ter recebido recursos de editais anteriores da PNAB em situação irregular',
  '• Ter capacidade técnica comprovada para execução da ação cultural proposta',
  '• A proposta deve ser inédita e não ter sido contemplada em outro edital vigente',
].join('\n')

export const TEMPLATE_ACOES = [
  '• Reserva de vagas para pessoas negras (mínimo 20% das vagas)',
  '• Reserva de vagas para pessoas com deficiência (mínimo 5% das vagas)',
  '• Prioridade para proponentes de comunidades tradicionais (quilombolas, indígenas)',
  '• Pontuação adicional para propostas que contemplem mulheres em situação de vulnerabilidade',
  '• Pontuação adicional para propostas realizadas em periferias e territórios de baixa renda',
  '• Incentivo a propostas que promovam a cultura afro-brasileira e indígena',
].join('\n')

export const COTAS_SUGERIDAS = [
  { key: 'negros', label: 'Cotas Pessoas Negras', vagas: 0 },
  { key: 'indigena_pcd', label: 'Cotas Indígenas e/ou PCD', vagas: 0 },
]
