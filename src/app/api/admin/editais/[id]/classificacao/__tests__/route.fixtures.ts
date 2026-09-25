import { vi } from 'vitest'
import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { registrarEmissao, type Emissao } from '@/lib/documentos/emissao'
import { templatePreferido } from '@/lib/documentos/preferencia'
import { generateListaClassificacao } from '@/lib/pdf/lista-classificacao'
import { gerarListaClassificacaoV1 } from '@/lib/pdf/template-1/lista-classificacao'
import { montarClassificacao, type CategoriaClassificada } from '@/lib/results/classificacao'

export const ITENS_BONUS = {
  maxItens: 2,
  itens: [
    { key: 'pcd', label: 'Pessoa com deficiência', pontos: 5 },
    { key: 'etnico_racial', label: 'Étnico-racial', pontos: 5 },
  ],
}

export const EDITAL = {
  titulo: 'Festival de Arte e Cultura',
  ano: 2026,
  slug: 'festival',
  status: 'AVALIACAO',
  vagasSuplentes: null,
  notaMinima: null,
  categoriasConfig: null,
  bonusVisivelParaAdmin: false,
  itensBonus: ITENS_BONUS,
}

/** Linha da classificação calculada: classificada em 1º lugar, com nota 85 (80 + 5 de bônus no item `pcd`). */
export function linhaClassificada(
  numero = 'PNAB-2026-0001',
  parcial: Partial<CategoriaClassificada['linhas'][number]> = {},
): CategoriaClassificada['linhas'][number] {
  return {
    inscricaoId: `id-${numero}`, numero, proponenteNome: 'Ana', posicao: 1,
    notaBase: 80, notaBonus: 5, notaFinal: 85, cotista: false, bonusItens: ['pcd'],
    status: 'CONTEMPLADA', finalizadas: 3, atribuidos: 3, empatado: false, semAvaliacao: false,
    ...parcial,
  }
}

export function categoriaComLinhas(linhas: CategoriaClassificada['linhas']): CategoriaClassificada[] {
  return [{ nome: 'Música', vagasAmplaConcorrencia: 1, cotas: [], valorPorProjeto: 5000, linhas }]
}

const EMISSAO: Emissao = {
  codigo: 'PNAB-ABCD-2345',
  emitidoEm: new Date('2026-09-21T15:00:00Z'),
  urlVerificacao: 'https://portal.exemplo/verificar/PNAB-ABCD-2345',
  hashConteudo: 'hash',
  template: 2,
}

export function makeReq(query = '') {
  return new NextRequest(`http://localhost:3000/api/admin/editais/ed-1/classificacao${query}`)
}

export function params(id = 'ed-1') {
  return { params: Promise.resolve({ id }) }
}

export function comoUsuario(role: string) {
  vi.mocked(auth).mockResolvedValue({ user: { id: 'admin-1', role } } as never)
}

/**
 * ADMIN autenticado, edital com bonificação configurada e uma categoria com
 * uma inscrição, preferência de layout na versão 2. Os módulos de emissão, de
 * preferência, do cálculo e dos dois geradores precisam estar mockados no
 * arquivo de teste que chama isto.
 */
export function prepararCenarioPadrao() {
  vi.clearAllMocks()
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  comoUsuario('ADMIN')
  vi.mocked(prisma.edital.findUnique).mockResolvedValue(EDITAL as never)
  vi.mocked(prisma.inscricao.count).mockResolvedValue(0 as never)
  vi.mocked(montarClassificacao).mockResolvedValue(categoriaComLinhas([linhaClassificada()]))
  vi.mocked(registrarEmissao).mockResolvedValue(EMISSAO)
  vi.mocked(templatePreferido).mockResolvedValue(2)
  vi.mocked(gerarListaClassificacaoV1).mockResolvedValue(Buffer.from('%PDF-v1'))
  vi.mocked(generateListaClassificacao).mockResolvedValue(Buffer.from('%PDF-v2'))
}
