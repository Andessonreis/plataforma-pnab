import type { CategoriaConfig } from '@/types/categoria-config'

// Fonte única de vagas, cotas e valor por projeto do Festival (Anexo I do edital).
// Alimenta o seed, a página pública e o PDF de habilitados — nunca digitar esses números em outro lugar.
// Duas cotas reservadas em todo o edital: pessoas negras e indígenas/PCD.
export const CATEGORIAS_CONFIG_FESTIVAL: CategoriaConfig[] = [
  { nome: 'Atividades de Formação/Curso', vagasAmplaConcorrencia: 3, cotas: [{ key: 'negros', label: 'Cotas Pessoas Negras', vagas: 1 }, { key: 'indigena_pcd', label: 'Cotas Indígenas e/ou PCD', vagas: 0 }], valorPorProjeto: 7000, valorTotalCategoria: 28000 },
  { nome: 'Música I', vagasAmplaConcorrencia: 2, cotas: [{ key: 'negros', label: 'Cotas Pessoas Negras', vagas: 1 }, { key: 'indigena_pcd', label: 'Cotas Indígenas e/ou PCD', vagas: 0 }], valorPorProjeto: 15000, valorTotalCategoria: 45000 },
  { nome: 'Música II', vagasAmplaConcorrencia: 3, cotas: [{ key: 'negros', label: 'Cotas Pessoas Negras', vagas: 1 }, { key: 'indigena_pcd', label: 'Cotas Indígenas e/ou PCD', vagas: 1 }], valorPorProjeto: 7000, valorTotalCategoria: 35000 },
  { nome: 'Sinfônicas e Filarmônicas', vagasAmplaConcorrencia: 2, cotas: [{ key: 'negros', label: 'Cotas Pessoas Negras', vagas: 0 }, { key: 'indigena_pcd', label: 'Cotas Indígenas e/ou PCD', vagas: 0 }], valorPorProjeto: 7000, valorTotalCategoria: 14000 },
  { nome: 'Arte Visual/Exposição', vagasAmplaConcorrencia: 2, cotas: [{ key: 'negros', label: 'Cotas Pessoas Negras', vagas: 1 }, { key: 'indigena_pcd', label: 'Cotas Indígenas e/ou PCD', vagas: 0 }], valorPorProjeto: 7000, valorTotalCategoria: 21000 },
  { nome: 'Dança I', vagasAmplaConcorrencia: 2, cotas: [{ key: 'negros', label: 'Cotas Pessoas Negras', vagas: 0 }, { key: 'indigena_pcd', label: 'Cotas Indígenas e/ou PCD', vagas: 0 }], valorPorProjeto: 5000, valorTotalCategoria: 10000 },
  { nome: 'Economia Criativa/Feiras e/ou Mostras', vagasAmplaConcorrencia: 2, cotas: [{ key: 'negros', label: 'Cotas Pessoas Negras', vagas: 0 }, { key: 'indigena_pcd', label: 'Cotas Indígenas e/ou PCD', vagas: 0 }], valorPorProjeto: 20000, valorTotalCategoria: 40000 },
  { nome: 'Teatro', vagasAmplaConcorrencia: 2, cotas: [{ key: 'negros', label: 'Cotas Pessoas Negras', vagas: 1 }, { key: 'indigena_pcd', label: 'Cotas Indígenas e/ou PCD', vagas: 0 }], valorPorProjeto: 10000, valorTotalCategoria: 30000 },
  { nome: 'Poesia/Sarau', vagasAmplaConcorrencia: 2, cotas: [{ key: 'negros', label: 'Cotas Pessoas Negras', vagas: 0 }, { key: 'indigena_pcd', label: 'Cotas Indígenas e/ou PCD', vagas: 0 }], valorPorProjeto: 3000, valorTotalCategoria: 6000 },
  { nome: 'Literatura/Publicação Livro', vagasAmplaConcorrencia: 2, cotas: [{ key: 'negros', label: 'Cotas Pessoas Negras', vagas: 0 }, { key: 'indigena_pcd', label: 'Cotas Indígenas e/ou PCD', vagas: 0 }], valorPorProjeto: 15000, valorTotalCategoria: 30000 },
  { nome: 'Audiovisual/Cinema', vagasAmplaConcorrencia: 3, cotas: [{ key: 'negros', label: 'Cotas Pessoas Negras', vagas: 1 }, { key: 'indigena_pcd', label: 'Cotas Indígenas e/ou PCD', vagas: 0 }], valorPorProjeto: 2000, valorTotalCategoria: 8000 },
  { nome: 'Cultura Popular', vagasAmplaConcorrencia: 3, cotas: [{ key: 'negros', label: 'Cotas Pessoas Negras', vagas: 1 }, { key: 'indigena_pcd', label: 'Cotas Indígenas e/ou PCD', vagas: 0 }], valorPorProjeto: 5000, valorTotalCategoria: 20000 },
  { nome: 'Cultura Hip Hop/Grafite', vagasAmplaConcorrencia: 2, cotas: [{ key: 'negros', label: 'Cotas Pessoas Negras', vagas: 0 }, { key: 'indigena_pcd', label: 'Cotas Indígenas e/ou PCD', vagas: 0 }], valorPorProjeto: 7000, valorTotalCategoria: 14000 },
  { nome: 'Cultura Hip Hop/Batalha de Rua', vagasAmplaConcorrencia: 1, cotas: [{ key: 'negros', label: 'Cotas Pessoas Negras', vagas: 0 }, { key: 'indigena_pcd', label: 'Cotas Indígenas e/ou PCD', vagas: 0 }], valorPorProjeto: 5000, valorTotalCategoria: 5000 },
  { nome: 'Outros Serviços de Terceiros - Pessoa Jurídica', vagasAmplaConcorrencia: null, cotas: [], valorPorProjeto: null, valorTotalCategoria: 60272.49 },
]

function pluralVagas(total: number): string {
  return `${total} ${total === 1 ? 'vaga' : 'vagas'}`
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** Texto "N vagas · R$ X por projeto" de uma categoria, calculado a partir da configuração do edital. */
export function vagasInfoDaCategoria(nome: string): string {
  const config = CATEGORIAS_CONFIG_FESTIVAL.find((c) => c.nome === nome)
  if (!config || config.valorPorProjeto === null || config.vagasAmplaConcorrencia === null) {
    throw new Error(`Categoria do Festival sem vagas/valor configurados: ${nome}`)
  }
  const vagas = config.vagasAmplaConcorrencia + config.cotas.reduce((acc, c) => acc + c.vagas, 0)
  return `${pluralVagas(vagas)} · ${formatarMoeda(config.valorPorProjeto)} por projeto`
}
