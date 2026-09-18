import {
  addProtocolBadge,
  addCompactSection,
  addInfoBlock,
  addDivider,
  addLegalNotice,
} from './layout-helpers'
import { maskCpfCnpjParcial } from '@/lib/utils/mask'
import type { Emissao } from '@/lib/documentos/emissao'
import { criarDocumentoOficial, finalizarDocumento } from './documento-oficial'
import { CORES, FONTES, LARGURA_UTIL, X_ESQUERDA } from './documento-oficial/tema'

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface ComprovanteData {
  numero: string
  proponente: {
    nome: string
    cpfCnpj: string
    email: string
    tipoProponente: string
  }
  edital: {
    titulo: string
    ano: number
  }
  categoria?: string | null
  submittedAt: Date
  campos?: Record<string, unknown>
  /** Registro de emissão; null quando o registro falhou (o PDF sai mesmo assim). */
  emissao?: Emissao | null
}

// Número máximo de campos do formulário exibidos no comprovante.
// Campos adicionais ficam disponíveis na plataforma.
const MAX_CAMPOS_EXIBIDOS = 6

// ─── Geração do comprovante ──────────────────────────────────────────────────

/** Gera o comprovante de inscrição — peça de uma página entregue ao proponente. */
export async function generateComprovante(data: ComprovanteData): Promise<Buffer> {
  const doc = await criarDocumentoOficial({
    rotulo: 'Comprovante',
    titulo: 'Comprovante de Inscrição',
    subtitulo: `${data.edital.titulo} · ${data.edital.ano}`,
    emissao: data.emissao ?? null,
  })

  addProtocolBadge(doc, data.numero)

  // ── Edital ────────────────────────────────────────────────────────────────
  addCompactSection(doc, 'Edital')
  addInfoBlock(doc, [
    { label: 'Título', value: data.edital.titulo },
    { label: 'Ano', value: String(data.edital.ano) },
    ...(data.categoria ? [{ label: 'Categoria', value: data.categoria }] : []),
  ])
  addDivider(doc)

  // ── Proponente ────────────────────────────────────────────────────────────
  addCompactSection(doc, 'Proponente')
  addInfoBlock(doc, [
    { label: 'Nome', value: data.proponente.nome },
    { label: 'CPF/CNPJ', value: maskCpfCnpjParcial(data.proponente.cpfCnpj) },
    { label: 'E-mail', value: data.proponente.email },
    { label: 'Tipo', value: formatTipoProponente(data.proponente.tipoProponente) },
  ])
  addDivider(doc)

  // ── Data de envio ─────────────────────────────────────────────────────────
  addCompactSection(doc, 'Inscrição')
  addInfoBlock(doc, [
    {
      label: 'Data de Envio',
      value: data.submittedAt.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo',
      }),
    },
    { label: 'Protocolo', value: data.numero },
  ])

  // ── Resumo dos campos (max MAX_CAMPOS_EXIBIDOS) ───────────────────────────
  const camposRelevantes = buildCamposResumo(data.campos, MAX_CAMPOS_EXIBIDOS)
  if (camposRelevantes.length > 0) {
    addDivider(doc)
    addCompactSection(doc, 'Dados do Projeto (resumo)')
    addInfoBlock(doc, camposRelevantes)

    const total = Object.values(data.campos ?? {}).filter(
      (v) => v !== null && v !== undefined && v !== '',
    ).length
    if (total > MAX_CAMPOS_EXIBIDOS) {
      doc.font(FONTES.corpoItalico).fontSize(8).fillColor(CORES.apoio)
        .text(
          `Exibindo ${MAX_CAMPOS_EXIBIDOS} de ${total} campos. Os dados completos ficam na plataforma.`,
          X_ESQUERDA, doc.y + 4, { width: LARGURA_UTIL },
        )
    }
  }

  // ── Aviso legal e footer ──────────────────────────────────────────────────
  addLegalNotice(
    doc,
    'Este documento é o comprovante oficial de inscrição no edital acima referido. ' +
    'Guarde este protocolo para acompanhamento e apresentação quando solicitado. ' +
    'A inscrição será analisada conforme os critérios estabelecidos no edital.',
  )
  return finalizarDocumento(doc, [
    { rotulo: 'Documento', valor: 'Comprovante de inscrição' },
    { rotulo: 'Edital', valor: `${data.edital.titulo} (${data.edital.ano})` },
    { rotulo: 'Inscrição', valor: data.numero },
    { rotulo: 'Proponente', valor: data.proponente.nome },
  ])
}

// ─── Helpers privados ────────────────────────────────────────────────────────

function formatTipoProponente(tipo: string): string {
  const map: Record<string, string> = {
    PF: 'Pessoa Física',
    PJ: 'Pessoa Jurídica',
    MEI: 'Microempreendedor Individual (MEI)',
    COLETIVO: 'Coletivo Cultural',
  }
  return map[tipo] ?? tipo
}

/**
 * Filtra e formata os campos do formulário para exibição resumida no comprovante.
 * Exclui campos vazios e limita ao máximo definido.
 */
function buildCamposResumo(
  campos: Record<string, unknown> | undefined,
  max: number,
): Array<{ label: string; value: string }> {
  if (!campos) return []

  return Object.entries(campos)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .slice(0, max)
    .map(([key, value]) => {
      const rawStr = typeof value === 'object' ? JSON.stringify(value) : String(value)
      // Truncar valores muito longos para não quebrar layout
      const truncated = rawStr.length > 80 ? `${rawStr.slice(0, 77)}...` : rawStr
      // Converter camelCase/snake_case para label legível
      const label = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .replace(/^\w/, (c) => c.toUpperCase())
        .trim()
      return { label, value: truncated }
    })
}
