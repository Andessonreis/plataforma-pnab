import { vagasInfoDaCategoria } from './categorias-festival'

export interface PropostaSuplenteFestival {
  posicao: number
  numero: string
  nome: string
  cpfCnpj: string
  modalidade: string
  notaFinal: number
  convocado: boolean
  situacao: string
  motivo?: string
}

export interface CategoriaSuplentesFestival {
  nome: string
  ancora: string
  vagasInfo: string
  propostas: PropostaSuplenteFestival[]
}

const SUPLENTES_FESTIVAL: Omit<CategoriaSuplentesFestival, 'vagasInfo'>[] = [
  {
    nome: 'Arte Visual/Exposição',
    ancora: 'arte-visual-exposicao',
    propostas: [
      {
        posicao: 4,
        numero: 'PNAB-2026-0154',
        nome: 'Sabrina Silva Vieira',
        cpfCnpj: '04846428559',
        modalidade: 'Ampla concorrência',
        notaFinal: 92.50,
        convocado: true,
        situacao: 'Convocado',
        motivo: 'Vaga remanescente (saldo de recursos)',
      },
    ],
  },
  {
    nome: 'Atividades de Formação/Curso',
    ancora: 'atividades-de-formacao-curso',
    propostas: [
      {
        posicao: 11,
        numero: 'PNAB-2026-0073',
        nome: 'Jamile da Silva Souza',
        cpfCnpj: '03526295506',
        modalidade: 'Cota — Pessoas Negras',
        notaFinal: 77.17,
        convocado: true,
        situacao: 'Convocado',
        motivo: 'Vaga remanescente (saldo de recursos)',
      },
    ],
  },
  {
    nome: 'Cultura Hip Hop/Batalha de Rua',
    ancora: 'cultura-hip-hop-batalha-de-rua',
    propostas: [
      {
        posicao: 2,
        numero: 'PNAB-2026-0113',
        nome: 'Miquéias Ferreira Pereira',
        cpfCnpj: '86773032512',
        modalidade: 'Ampla concorrência',
        notaFinal: 75.00,
        convocado: true,
        situacao: 'Convocado',
        motivo: 'Vaga remanescente (saldo de recursos)',
      },
    ],
  },
  {
    nome: 'Cultura Popular',
    ancora: 'cultura-popular',
    propostas: [
      {
        posicao: 5,
        numero: 'PNAB-2026-0091',
        nome: 'AME Capoeira',
        cpfCnpj: '56025456000160',
        modalidade: 'Ampla concorrência',
        notaFinal: 61.00,
        convocado: false,
        situacao: 'Desclassificado',
        motivo: 'Não apresentação da documentação exigida na habilitação documental',
      },
      {
        posicao: 7,
        numero: 'PNAB-2026-0007',
        nome: 'Paulo Ricardo da Silva Nascimento',
        cpfCnpj: '06092418509',
        modalidade: 'Ampla concorrência',
        notaFinal: 50.50,
        convocado: true,
        situacao: 'Convocado',
        motivo: 'Suplente convocado para vaga remanescente',
      },
    ],
  },
  {
    nome: 'Literatura/Publicação Livro',
    ancora: 'literatura-publicacao-livro',
    propostas: [
      {
        posicao: 7,
        numero: 'PNAB-2026-0158',
        nome: 'Arnobson dos Santos Costa',
        cpfCnpj: '00222509562',
        modalidade: 'Cota — Pessoas Negras',
        notaFinal: 89.83,
        convocado: true,
        situacao: 'Convocado',
        motivo: 'Vaga remanescente (saldo de recursos)',
      },
    ],
  },
  {
    nome: 'Música II',
    ancora: 'musica-ii',
    propostas: [
      {
        posicao: 6,
        numero: 'PNAB-2026-0008',
        nome: 'Leonardo Souza Almeida Ferreira',
        cpfCnpj: '05316608500',
        modalidade: 'Ampla concorrência',
        notaFinal: 91.17,
        convocado: true,
        situacao: 'Convocado',
        motivo: 'Vaga remanescente (saldo de recursos)',
      },
    ],
  },
  {
    nome: 'Teatro',
    ancora: 'teatro',
    propostas: [
      {
        posicao: 3,
        numero: 'PNAB-2026-0040',
        nome: 'Gabriel Pereira Rocha',
        cpfCnpj: '06824085570',
        modalidade: 'Ampla concorrência',
        notaFinal: 91.50,
        convocado: true,
        situacao: 'Convocado',
        motivo: 'Vaga remanescente (saldo de recursos)',
      },
    ],
  },
]

export const CATEGORIAS_SUPLENTES_FESTIVAL: CategoriaSuplentesFestival[] = SUPLENTES_FESTIVAL.map((cat) => ({
  ...cat,
  vagasInfo: vagasInfoDaCategoria(cat.nome),
}))
