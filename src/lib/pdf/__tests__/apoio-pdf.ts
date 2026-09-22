import { PDFDocument } from 'pdf-lib'
import type { AgenteRow } from '@/lib/agentes/campos'
import type { Emissao } from '@/lib/documentos/emissao'
import type {
  ListaAgentesData, ListaInscricoesData, ListaInscricoesItem,
} from '@/lib/pdf/modelo/tipos'

/** Registro de emissão fixo, para os geradores desenharem o protocolo e o QR. */
export const EMISSAO_TESTE: Emissao = {
  codigo: 'PNAB-ABCD-2345',
  emitidoEm: new Date('2026-09-21T15:00:00Z'),
  urlVerificacao: 'https://portal.exemplo/verificar/PNAB-ABCD-2345',
  hashConteudo: 'a'.repeat(64),
  template: 2,
}

/** O que os testes de gerador conferem num PDF: assinatura do arquivo, título e nº de páginas. */
export async function lerPdf(buffer: Buffer): Promise<{
  assinatura: string
  titulo: string | undefined
  paginas: number
}> {
  const pdf = await PDFDocument.load(buffer)
  return {
    assinatura: buffer.subarray(0, 5).toString('latin1'),
    titulo: pdf.getTitle(),
    paginas: pdf.getPageCount(),
  }
}

/** Inscrição da relação; o protocolo acompanha a posição. */
export function itemDeLista(posicao: number, parcial: Partial<ListaInscricoesItem> = {}): ListaInscricoesItem {
  return {
    posicao,
    numero: `PNAB-2026-${String(posicao).padStart(4, '0')}`,
    nome: 'Maria da Silva',
    cpfCnpj: '12345678901',
    categoria: 'Música',
    telefone: '74999998888',
    notaFinal: 87.5,
    motivoInabilitacao: null,
    ...parcial,
  }
}

/**
 * Relação de inscrições enviadas, com o registro de emissão. `quantidade`
 * (padrão 2) gera os itens; passar `inscricoes` os substitui, e o total
 * acompanha a lista, a menos que `total` seja informado.
 */
export function listaInscricoesDeTeste(
  { quantidade = 2, ...parcial }: Partial<ListaInscricoesData> & { quantidade?: number } = {},
): ListaInscricoesData {
  const inscricoes = parcial.inscricoes ?? Array.from({ length: quantidade }, (_, i) => itemDeLista(i + 1))
  return {
    edital: { titulo: 'Edital de teste', ano: 2026 },
    status: 'ENVIADA',
    statusLabel: 'Enviada',
    inscricoes,
    total: inscricoes.length,
    emissao: EMISSAO_TESTE,
    ...parcial,
  }
}

export function agenteDeTeste(parcial: Partial<AgenteRow> = {}): AgenteRow {
  return {
    nome: '  Maria da Silva  ',
    email: 'maria@exemplo.gov.br',
    telefone: '74988887777',
    cpfCnpj: '12345678901',
    tipoProponente: 'PF',
    role: 'PROPONENTE',
    cidade: 'Irecê',
    uf: 'BA',
    ativo: true,
    totalInscricoes: 2,
    createdAt: new Date('2026-03-10T12:00:00Z'),
    ...parcial,
  }
}

/**
 * Lista de agentes com quatro campos de contato e o registro de emissão.
 * `quantidade` (padrão 2) gera os cadastros; passar `agentes` sobrepõe.
 */
export function listaAgentesDeTeste(
  { quantidade = 2, ...parcial }: Partial<ListaAgentesData> & { quantidade?: number } = {},
): ListaAgentesData {
  return {
    filtros: [{ label: 'Perfil', value: 'Proponente' }],
    campos: ['nome', 'email', 'telefone', 'cpfCnpj'],
    agentes: Array.from({ length: quantidade }, (_, i) => agenteDeTeste({ nome: `Agente ${i + 1}` })),
    emissao: EMISSAO_TESTE,
    ...parcial,
  }
}
