export interface PropostaHabilitacaoFestival {
  posicao: number
  numero: string
  nome: string
  cpfCnpj: string
  modalidade: string
  notaFinal: number
  habilitado: boolean
  motivo?: string
}

export interface CategoriaHabilitacaoFestival {
  nome: string
  ancora: string
  vagasInfo?: string
  propostas: PropostaHabilitacaoFestival[]
}

export const SLUG_FESTIVAL = 'festival-arte-cultura-irece-centenario-2026'

export function isEditalFestival(slug: string): boolean {
  return slug === SLUG_FESTIVAL
}

export const CATEGORIAS_HABILITACAO_FESTIVAL: CategoriaHabilitacaoFestival[] = [
  {
    nome: 'Arte Visual/Exposição',
    ancora: 'arte-visual-exposicao',
    vagasInfo: '3 vagas · R$ 7.000,00 por projeto',
    propostas: [
      { posicao: 1, numero: 'PNAB-2026-0139', nome: 'Cleriston Kerley Dourado', cpfCnpj: '00326220585', modalidade: 'Ampla concorrência', notaFinal: 95.00, habilitado: true },
      { posicao: 2, numero: 'PNAB-2026-0155', nome: 'Lenec Mota da Silva', cpfCnpj: '06500529510', modalidade: 'Cota — Pessoas Negras', notaFinal: 93.33, habilitado: true },
      { posicao: 3, numero: 'PNAB-2026-0092', nome: 'Jadson Silva Reis', cpfCnpj: '07580196530', modalidade: 'Cota — Pessoas Negras', notaFinal: 93.17, habilitado: true },
    ],
  },
  {
    nome: 'Atividades de Formação/Curso',
    ancora: 'atividades-de-formacao-curso',
    vagasInfo: '4 vagas · R$ 6.000,00 por projeto',
    propostas: [
      { posicao: 1, numero: 'PNAB-2026-0135', nome: 'Gleige Souza Pereira', cpfCnpj: '05699510540', modalidade: 'Ampla concorrência', notaFinal: 98.33, habilitado: true },
      { posicao: 2, numero: 'PNAB-2026-0066', nome: 'nicolle da conceicao barros', cpfCnpj: '63881900000105', modalidade: 'Ampla concorrência', notaFinal: 94.17, habilitado: true },
      { posicao: 3, numero: 'PNAB-2026-0068', nome: 'Danielle Mendes Paiva', cpfCnpj: '06358406507', modalidade: 'Ampla concorrência', notaFinal: 93.67, habilitado: true },
      { posicao: 7, numero: 'PNAB-2026-0036', nome: 'Geisa vitória de oliveira Landim', cpfCnpj: '86589406596', modalidade: 'Cota — Pessoas Negras', notaFinal: 83.67, habilitado: true },
    ],
  },
  {
    nome: 'Audiovisual/Cinema',
    ancora: 'audiovisual-cinema',
    vagasInfo: '4 vagas · R$ 10.000,00 por projeto',
    propostas: [
      { posicao: 1, numero: 'PNAB-2026-0023', nome: 'Marcelo Barreto de Lima', cpfCnpj: '03014631582', modalidade: 'Ampla concorrência', notaFinal: 101.50, habilitado: true },
      { posicao: 2, numero: 'PNAB-2026-0024', nome: 'Alexander Gondim Barretto', cpfCnpj: '05849484507', modalidade: 'Ampla concorrência', notaFinal: 87.50, habilitado: false, motivo: 'Pendência/Ausência de documentação' },
      { posicao: 3, numero: 'PNAB-2026-0085', nome: 'Kaique Amador dos Santos', cpfCnpj: '51349037869', modalidade: 'Cota — Pessoas Negras', notaFinal: 70.00, habilitado: true },
      { posicao: 4, numero: 'PNAB-2026-0140', nome: 'Ayslan Kevin Costa Brandão', cpfCnpj: '12612741569', modalidade: 'Cota — Pessoas Negras', notaFinal: 69.83, habilitado: true },
    ],
  },
  {
    nome: 'Cultura Hip Hop/Batalha de Rua',
    ancora: 'cultura-hip-hop-batalha-de-rua',
    vagasInfo: '1 vaga · R$ 5.000,00 por projeto',
    propostas: [
      { posicao: 1, numero: 'PNAB-2026-0025', nome: 'Italo Jonmar Almeida de Oliveira', cpfCnpj: '05886825517', modalidade: 'Ampla concorrência', notaFinal: 91.33, habilitado: true },
    ],
  },
  {
    nome: 'Cultura Hip Hop/Grafite',
    ancora: 'cultura-hip-hop-grafite',
    vagasInfo: '1 vaga · R$ 5.000,00 por projeto',
    propostas: [
      { posicao: 1, numero: 'PNAB-2026-0076', nome: 'Maicon Nunes Bastos', cpfCnpj: '07137577520', modalidade: 'Ampla concorrência', notaFinal: 87.83, habilitado: true },
    ],
  },
  {
    nome: 'Cultura Popular',
    ancora: 'cultura-popular',
    vagasInfo: '4 vagas · R$ 5.000,00 por projeto',
    propostas: [
      { posicao: 1, numero: 'PNAB-2026-0051', nome: 'Associação Quilombola Comunitária de Convivência com o semiárido', cpfCnpj: '10733827000168', modalidade: 'Cota — Pessoas Negras', notaFinal: 99.00, habilitado: true },
      { posicao: 2, numero: 'PNAB-2026-0110', nome: 'Grupo de Capoeira Araúna', cpfCnpj: '10763778583', modalidade: 'Cota — Pessoas Negras', notaFinal: 87.83, habilitado: false, motivo: 'Pendência/Ausência de documentação' },
      { posicao: 3, numero: 'PNAB-2026-0106', nome: 'Raiane Kedma de Sousa Silva', cpfCnpj: '06923278511', modalidade: 'Ampla concorrência', notaFinal: 80.50, habilitado: true },
      { posicao: 6, numero: 'PNAB-2026-0013', nome: 'Francinaudo Sousa da Silva', cpfCnpj: '92503632572', modalidade: 'Cota — Pessoas Negras', notaFinal: 54.17, habilitado: true },
    ],
  },
  {
    nome: 'Economia Criativa/Feiras e/ou Mostras',
    ancora: 'economia-criativa-feiras-e-ou-mostras',
    vagasInfo: '2 vagas · R$ 8.000,00 por projeto',
    propostas: [
      { posicao: 1, numero: 'PNAB-2026-0035', nome: 'Sandra Fernandes de Sousa', cpfCnpj: '00053119509', modalidade: 'Cota — Pessoas Negras', notaFinal: 105.33, habilitado: true },
      { posicao: 2, numero: 'PNAB-2026-0037', nome: 'Romário Rodrigues de Oliveira Júnior', cpfCnpj: '02890477576', modalidade: 'Cota — Pessoas Negras', notaFinal: 94.50, habilitado: true },
    ],
  },
  {
    nome: 'Literatura/Publicação Livro',
    ancora: 'literatura-publicacao-livro',
    vagasInfo: '2 vagas · R$ 10.000,00 por projeto',
    propostas: [
      { posicao: 1, numero: 'PNAB-2026-0148', nome: 'Caique Sousa Queiroz', cpfCnpj: '06939749586', modalidade: 'Cota — Pessoas Negras', notaFinal: 98.17, habilitado: true },
      { posicao: 2, numero: 'PNAB-2026-0022', nome: 'João Pablo Trabuco de Oliveira', cpfCnpj: '03851938585', modalidade: 'Ampla concorrência', notaFinal: 96.50, habilitado: true },
    ],
  },
  {
    nome: 'Música I',
    ancora: 'musica-i',
    vagasInfo: '3 vagas · R$ 8.000,00 por projeto',
    propostas: [
      { posicao: 1, numero: 'PNAB-2026-0074', nome: 'FERNANDA SODRE CUNHA', cpfCnpj: '01584369540', modalidade: 'Ampla concorrência', notaFinal: 92.17, habilitado: true },
      { posicao: 2, numero: 'PNAB-2026-0117', nome: 'César Augusto Barros', cpfCnpj: '06402286583', modalidade: 'Ampla concorrência', notaFinal: 92.00, habilitado: true },
      { posicao: 3, numero: 'PNAB-2026-0108', nome: 'Luan Dias de Souza', cpfCnpj: '04926035537', modalidade: 'Cota — Pessoas Negras', notaFinal: 85.00, habilitado: true },
    ],
  },
  {
    nome: 'Música II',
    ancora: 'musica-ii',
    vagasInfo: '5 vagas · R$ 5.000,00 por projeto',
    propostas: [
      { posicao: 1, numero: 'PNAB-2026-0145', nome: '57.845.237 FABRICIA DE SOUZA SILVA', cpfCnpj: '57845237000190', modalidade: 'Ampla concorrência', notaFinal: 99.50, habilitado: true },
      { posicao: 2, numero: 'PNAB-2026-0112', nome: '33.662.146 LAIO RODRIGUES PINTO', cpfCnpj: '33662146000151', modalidade: 'Ampla concorrência', notaFinal: 94.17, habilitado: true },
      { posicao: 3, numero: 'PNAB-2026-0011', nome: 'Uelisson Monteiro de Alcantara Silva', cpfCnpj: '06363453518', modalidade: 'Cota — Pessoas Negras', notaFinal: 93.33, habilitado: true },
      { posicao: 4, numero: 'PNAB-2026-0050', nome: 'RAISSA DE SOUSA MATIAS', cpfCnpj: '86400820574', modalidade: 'Ampla concorrência', notaFinal: 92.67, habilitado: true },
      { posicao: 5, numero: 'PNAB-2026-0041', nome: 'Marcos Vinicius Santana Magalhães', cpfCnpj: '04535450501', modalidade: 'Cota — Pessoas Negras', notaFinal: 91.33, habilitado: true },
    ],
  },
  {
    nome: 'Poesia/Sarau',
    ancora: 'poesia-sarau',
    vagasInfo: '2 vagas · R$ 4.000,00 por projeto',
    propostas: [
      { posicao: 1, numero: 'PNAB-2026-0151', nome: 'Larissa Carneiro de Souza', cpfCnpj: '86038280596', modalidade: 'Ampla concorrência', notaFinal: 91.17, habilitado: true },
      { posicao: 2, numero: 'PNAB-2026-0111', nome: 'Luiz André Marques Dourado', cpfCnpj: '77062345504', modalidade: 'Ampla concorrência', notaFinal: 89.83, habilitado: true },
    ],
  },
  {
    nome: 'Sinfônicas e Filarmônicas',
    ancora: 'sinfonicas-e-filarmonicas',
    vagasInfo: '2 vagas · R$ 15.000,00 por projeto',
    propostas: [
      { posicao: 1, numero: 'PNAB-2026-0045', nome: 'Sociedade Musical e Beneficente de Irecê', cpfCnpj: '03410823000183', modalidade: 'Ampla concorrência', notaFinal: 93.67, habilitado: true },
      { posicao: 2, numero: 'PNAB-2026-0105', nome: 'Centro Espirita Jesus de Nazaré', cpfCnpj: '16445785000146', modalidade: 'Cota — Pessoas Negras', notaFinal: 72.83, habilitado: true },
    ],
  },
  {
    nome: 'Teatro',
    ancora: 'teatro',
    vagasInfo: '3 vagas · R$ 8.000,00 por projeto',
    propostas: [
      { posicao: 1, numero: 'PNAB-2026-0057', nome: 'KAREN RODRIGUES MOITINHO', cpfCnpj: '06029773550', modalidade: 'Cota — Indígenas e/ou PcD', notaFinal: 99.17, habilitado: true },
      { posicao: 2, numero: 'PNAB-2026-0143', nome: 'IRISVANIA DE SOUZA FEITOZA LIMA', cpfCnpj: '03692008538', modalidade: 'Ampla concorrência', notaFinal: 94.83, habilitado: true },
      { posicao: 5, numero: 'PNAB-2026-0070', nome: 'Samara de Alcantara Pereira', cpfCnpj: '03441802551', modalidade: 'Cota — Pessoas Negras', notaFinal: 72.50, habilitado: true },
    ],
  },
]
