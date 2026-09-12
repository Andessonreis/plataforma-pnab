import type { CategoriaConfig } from '@/types/categoria-config'

export const categoriasConfigFormacao: CategoriaConfig[] = [
  {
    nome: 'Oficinas de Artes Cênicas e Dança',
    vagasAmplaConcorrencia: 3,
    cotas: [
      { key: 'negros', label: 'Cotas Pessoas Negras', vagas: 1 },
      { key: 'indigena_pcd', label: 'Cotas Indígenas e/ou PCD', vagas: 1 },
    ],
    valorPorProjeto: 8000,
    valorTotalCategoria: 40000,
  },
  {
    nome: 'Workshops de Música e Tradição Oral',
    vagasAmplaConcorrencia: 3,
    cotas: [
      { key: 'negros', label: 'Cotas Pessoas Negras', vagas: 1 },
      { key: 'indigena_pcd', label: 'Cotas Indígenas e/ou PCD', vagas: 0 },
    ],
    valorPorProjeto: 8000,
    valorTotalCategoria: 32000,
  },
  {
    nome: 'Formação em Artes Visuais e Artesanato',
    vagasAmplaConcorrencia: 2,
    cotas: [
      { key: 'negros', label: 'Cotas Pessoas Negras', vagas: 1 },
      { key: 'indigena_pcd', label: 'Cotas Indígenas e/ou PCD', vagas: 0 },
    ],
    valorPorProjeto: 8000,
    valorTotalCategoria: 24000,
  },
  {
    nome: 'Capacitação em Cultura Digital e Audiovisual',
    vagasAmplaConcorrencia: 2,
    cotas: [
      { key: 'negros', label: 'Cotas Pessoas Negras', vagas: 1 },
      { key: 'indigena_pcd', label: 'Cotas Indígenas e/ou PCD', vagas: 0 },
    ],
    valorPorProjeto: 8000,
    valorTotalCategoria: 24000,
  },
]

export const categoriasFormacao = categoriasConfigFormacao.map((c) => c.nome)

export const tiposAnexoFormacao = [
  { tipo: 'DOCUMENTO_PESSOAL', label: 'Documento pessoal oficial com foto (RG e CPF)', obrigatorio: true },
  { tipo: 'COMPROVANTE_ENDERECO', label: 'Comprovante de residência em Irecê (últimos 90 dias)', obrigatorio: true },
  { tipo: 'PORTFOLIO', label: 'Portfólio / Currículo artístico (atuação cultural mínima de 2 anos)', obrigatorio: true },
  { tipo: 'PROJETO', label: 'Proposta pedagógica e plano de aula da oficina', obrigatorio: true },
  { tipo: 'ORCAMENTO', label: 'Planilha orçamentária detalhada', obrigatorio: false },
  { tipo: 'AUTODECL_ETNICO_RACIAL', label: 'Autodeclaração Étnico-Racial (para optantes de cotas)', obrigatorio: false },
  { tipo: 'AUTODECL_PCD', label: 'Autodeclaração PCD com laudo médico (para optantes de cotas PCD)', obrigatorio: false },
  { tipo: 'DECLARACAO_REPRESENTACAO_GRUPO', label: 'Declaração de representação de coletivo (para grupos sem CNPJ)', obrigatorio: false },
  { tipo: 'CNPJ_DOCUMENTO', label: 'Cartão CNPJ / Certificado CCMEI (para PJ ou MEI)', obrigatorio: false },
  { tipo: 'CERTIDAO_MUNICIPAL', label: 'Certidão Negativa de Débitos Municipais de Irecê', obrigatorio: false },
]

export const camposFormularioFormacao = [
  { nome: 'nome_completo', label: 'Nome completo / Razão social', tipo: 'texto', obrigatorio: true, placeholder: '', opcoes: [], hint: '' },
  { nome: 'telefone_contato', label: 'Telefone/WhatsApp para contato', tipo: 'texto', obrigatorio: true, placeholder: '(74) 90000-0000', opcoes: [], hint: '' },
  { nome: 'email_contato', label: 'E-mail de contato', tipo: 'texto', obrigatorio: true, placeholder: '', opcoes: [], hint: '' },
]

export const etapasCustomizadasFormacao = [
  {
    id: 'proposta-formativa',
    titulo: 'Proposta Formativa',
    descricao: 'Detalhamento metodológico da atividade de formação cultural proposta.',
    ordem: 0,
    campos: [
      { nome: 'nome_oficina', label: 'Título da Oficina / Curso', tipo: 'texto', obrigatorio: true, placeholder: '', opcoes: [], hint: '' },
      { nome: 'ementa', label: 'Ementa e conteúdo programático', tipo: 'textarea', obrigatorio: true, placeholder: '', opcoes: [], hint: 'Descreva os tópicos a serem abordados e a relevância para a comunidade de Irecê.' },
      { nome: 'carga_horaria', label: 'Carga horária total (horas)', tipo: 'numero', obrigatorio: true, placeholder: 'Ex: 20', opcoes: [], hint: 'Mínimo de 16 horas/aula.' },
      { nome: 'vagas_oferecidas', label: 'Número de vagas oferecidas', tipo: 'numero', obrigatorio: true, placeholder: 'Ex: 25', opcoes: [], hint: 'Mínimo de 20 vagas gratuitas.' },
      { nome: 'local_realizacao', label: 'Espaço ou comunidade onde será realizada', tipo: 'texto', obrigatorio: true, placeholder: 'Ex: Centro Cultural de Irecê / Escola Municipal', opcoes: [], hint: '' },
      {
        nome: 'publico_prioritario',
        label: 'Público prioritário atendido',
        tipo: 'multiselect',
        obrigatorio: false,
        opcoes: ['Jovens de periferia', 'Mulheres', 'Pessoas Negras', 'Pessoas com Deficiência (PCD)', 'Comunidades Rurais', 'Idosos', 'Público Geral'],
        hint: 'Selecione os públicos contemplados.',
      },
    ],
  },
]

export const cronogramaFormacao = [
  { tipo: 'custom', label: 'Publicação do Edital', dataHora: '2026-07-20T00:00:00', destaque: false },
  { tipo: 'fase', fase: 'INSCRICOES_ABERTAS', dataHora: '2026-07-25T00:00:00', destaque: false },
  { tipo: 'fase', fase: 'INSCRICOES_ENCERRADAS', dataHora: '2026-08-25T23:59:59', destaque: false },
  { tipo: 'custom', label: 'Relação preliminar de inscritos', dataHora: '2026-08-26T12:00:00', destaque: false },
  { tipo: 'fase', fase: 'HABILITACAO', dataHora: '2026-09-01T00:00:00', destaque: true },
  { tipo: 'custom', label: 'Publicação do resultado da habilitação', dataHora: '2026-09-18T00:00:00', destaque: true, acao: 'PUBLICACAO_HABILITADOS' },
  { tipo: 'custom', label: 'Prazo recursal da habilitação', dataHora: '2026-09-19T00:00:00', fimEm: '2026-09-23T23:59:00', destaque: false, acao: 'RECURSO_HABILITACAO_JANELA' },
  { tipo: 'fase', fase: 'AVALIACAO', dataHora: '2026-09-25T00:00:00', destaque: true },
  { tipo: 'fase', fase: 'RESULTADO_FINAL', dataHora: '2026-10-10T00:00:00', destaque: true },
]
