import { maskCpfCnpj } from '@/lib/utils/mask'

export interface SuplenteConvocacao {
  posicao: number
  ordem: string
  numero: string
  nome: string
  cpfCnpj: string
  notaFinal: string
  situacao: string
  motivo: string
  classificado: boolean
}

export interface ObservacaoConvocacao {
  rotulo: string
  texto: string
}

export interface DadosConvocacaoSuplente {
  titulo: string
  editalTitulo: string
  editalTituloCurto: string
  editalNumero: string
  ano: string
  categoria: string
  vagasInfo: string
  suplentes: SuplenteConvocacao[]
  observacoes: ObservacaoConvocacao[]
}

const BASE_EDITAL_FESTIVAL = {
  titulo: 'Convocação de Suplente',
  editalTitulo: 'Festival de Arte e Cultura de Irecê — Centenário da Cidade',
  editalTituloCurto: 'Festival de Arte e Cultura de Irecê',
  editalNumero: 'Edital de Chamamento Público Nº 02/2026',
  ano: '2026',
}

export const DADOS_CONVOCACAO_SUPLENTE: DadosConvocacaoSuplente = {
  ...BASE_EDITAL_FESTIVAL,
  categoria: 'CULTURA POPULAR',
  vagasInfo: '4 vaga(s) · Vaga Remanescente de Suplência · R$ 5.000,00 por projeto',
  suplentes: [
    {
      posicao: 5,
      ordem: '2º suplente',
      numero: 'PNAB-2026-0091',
      nome: 'AME Capoeira',
      cpfCnpj: '**.025.456/0001-**',
      notaFinal: '61.00',
      situacao: 'Desclassificado',
      motivo: 'Não apresentação da documentação exigida na habilitação.',
      classificado: false,
    },
    {
      posicao: 7,
      ordem: '3º suplente',
      numero: 'PNAB-2026-0007',
      nome: 'Paulo Ricardo da Silva Nascimento',
      cpfCnpj: '***.924.185-**',
      notaFinal: '50.50',
      situacao: 'Classificado',
      motivo: 'Suplente Classificado — Convocado para vaga remanescente',
      classificado: true,
    },
  ],
  observacoes: [
    {
      rotulo: 'Desclassificação da Suplente (PNAB-2026-0091)',
      texto:
        'O proponente da inscrição PNAB-2026-0091 (AME Capoeira, 2º suplente na ordem) foi declarado Desclassificado em razão da não apresentação da documentação exigida na fase de habilitação documental dentro do prazo regulamentar.',
    },
    {
      rotulo: 'Convocação do Suplente Classificado (PNAB-2026-0007)',
      texto:
        'Com a desclassificação da suplente anterior, o suplente subsequente na ordem classificatória — PNAB-2026-0007 (Paulo Ricardo da Silva Nascimento, 3º suplente) — passa à condição de Classificado e fica oficialmente CONVOCADO para apresentar a documentação de habilitação e assumir a vaga remanescente.',
    },
  ],
}

export const DADOS_CONVOCACAO_SUPLENTE_LITERATURA: DadosConvocacaoSuplente = {
  ...BASE_EDITAL_FESTIVAL,
  categoria: 'LITERATURA/PUBLICAÇÃO LIVRO',
  vagasInfo: '2 vaga(s) · Vaga Remanescente de Suplência · R$ 15.000,00 por projeto',
  suplentes: [
    {
      posicao: 7,
      ordem: '7ª posição',
      numero: 'PNAB-2026-0158',
      nome: 'Arnobson dos Santos Costa',
      cpfCnpj: maskCpfCnpj('00222509562'),
      notaFinal: '89.83',
      situacao: 'Desclassificado',
      motivo: 'Proponente já contemplado na categoria Cultura Popular.',
      classificado: false,
    },
    {
      posicao: 3,
      ordem: '3ª posição',
      numero: 'PNAB-2026-0082',
      nome: 'Aline Dourado do Nascimento Malaquias',
      cpfCnpj: maskCpfCnpj('81848200544'),
      notaFinal: '95.33',
      situacao: 'Classificado',
      motivo: 'Suplente Classificada — Convocada para vaga remanescente',
      classificado: true,
    },
  ],
  observacoes: [
    {
      rotulo: 'Desclassificação do Suplente (PNAB-2026-0158)',
      texto:
        'O proponente da inscrição PNAB-2026-0158 (Arnobson dos Santos Costa) foi declarado Desclassificado nesta categoria por já ter sido contemplado na categoria Cultura Popular do mesmo edital, não sendo permitido ao proponente ser contemplado em mais de uma categoria.',
    },
    {
      rotulo: 'Convocação da Suplente Classificada (PNAB-2026-0082)',
      texto:
        'Com a desclassificação do suplente anterior, a proposta PNAB-2026-0082 (Aline Dourado do Nascimento Malaquias) passa à condição de Classificada e fica oficialmente CONVOCADA para apresentar a documentação de habilitação e assumir a vaga remanescente.',
    },
  ],
}
