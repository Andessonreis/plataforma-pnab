/**
 * Gerador de PDF completo do projeto — todas as seções, multi-página.
 * Reutiliza helpers modulares de shared.ts e layout-helpers.ts.
 */
import { createDocument, docToBuffer, MARGINS, CONTENT_WIDTH, COLORS, PAGE_WIDTH } from './shared'
import {
  addCompactHeader,
  addProtocolBadge,
  addCompactSection,
  addInfoBlock,
  addDivider,
  addLegalNotice,
  addCompactFooter,
  addTwoColumnRow,
} from './layout-helpers'
import type { CampoFormulario } from '@/types/campo-formulario'

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface ProjetoCompletoData {
  numero: string
  status: string
  proponente: {
    nome: string
    cpfCnpj: string
    email: string
    tipoProponente: string
  }
  edital: { titulo: string; ano: number }
  categoria?: string | null
  campos: Record<string, unknown>
  camposFormulario: CampoFormulario[]
  anexos: Array<{ titulo: string; tipo: string; valido?: boolean | null }>
  submittedAt: Date
}

// ─── Constantes ──────────────────────────────────────────────────────────────

const PAGE_HEIGHT = 841.89 // A4
const FOOTER_ZONE = 60 // espaço reservado para footer
const SAFE_BOTTOM = PAGE_HEIGHT - MARGINS.bottom - FOOTER_ZONE

// ─── Contexto de paginação ───────────────────────────────────────────────────

interface PageContext {
  pageNum: number
}

// ─── Helpers internos ────────────────────────────────────────────────────────

/** Verifica se há espaço; se não houver, faz page break. */
function checkPageBreak(doc: PDFKit.PDFDocument, requiredHeight: number, ctx: PageContext): void {
  if (doc.y + requiredHeight > SAFE_BOTTOM) {
    addCompactFooter(doc, ctx.pageNum)
    doc.addPage()
    ctx.pageNum++
    doc.y = MARGINS.top
  }
}

/** Busca a definição completa de um campo em camposFormulario pelo nome. */
function resolveCampoDef(key: string, camposFormulario: CampoFormulario[]): CampoFormulario | undefined {
  return camposFormulario.find((cf) => cf.nome === key)
}

/** Resolve o label de um campo: busca em camposFormulario, fallback para camelCase→legível. */
function resolveCampoLabel(key: string, camposFormulario: CampoFormulario[]): string {
  const def = resolveCampoDef(key, camposFormulario)
  if (def) return def.label
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim()
}

/** Mascara CPF/CNPJ para exibição. */
function maskCpfCnpj(value: string): string {
  if (!value) return '—'
  const digits = value.replace(/\D/g, '')
  if (digits.length <= 6) return value
  return `${digits.slice(0, 3)}.***.***-${digits.slice(-2)}`
}

/** Formata tipo de proponente. */
function formatTipoProponente(tipo: string): string {
  const map: Record<string, string> = {
    PF: 'Pessoa Física',
    PJ: 'Pessoa Jurídica',
    MEI: 'Microempreendedor Individual (MEI)',
    COLETIVO: 'Coletivo Cultural',
  }
  return map[tipo] ?? tipo
}

/** Formata valor como moeda BRL. */
function formatCurrency(value: unknown): string {
  const num = Number(value)
  if (isNaN(num)) return String(value)
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** Formata data no padrão DD/MM/YYYY. */
/**
 * Formata data no padrão DD/MM/YYYY.
 *
 * Datas puras "YYYY-MM-DD" (sem hora, ex.: cronograma de execução) extraem
 * o dia/mês/ano direto da string — sem passar por `Date`, que interpretaria
 * como meia-noite UTC e, convertido pra America/Sao_Paulo (UTC-3), voltaria
 * pro dia anterior (28/09 virando 27/09 no PDF). Valores com hora (ISO
 * completo) continuam pelo caminho antigo, onde a conversão de fuso faz sentido.
 */
function formatDate(value: unknown): string {
  const str = String(value)
  const dataPura = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str)
  if (dataPura) {
    const [, ano, mes, dia] = dataPura
    return `${dia}/${mes}/${ano}`
  }
  const date = new Date(str)
  if (isNaN(date.getTime())) return str
  return date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

/**
 * Formata um item de campo estruturado (uma linha de `tabela` ou um item de
 * `grupo_repetivel`) como bloco "Label: valor" legível, um por linha —
 * reaproveita formatCampoValue pra cada subcampo (datas e moedas dos
 * subcampos saem formatadas igual aos campos de primeiro nível).
 */
function formatarItemEstrutura(item: Record<string, unknown>, subcampos: CampoFormulario[]): string {
  return subcampos
    .map((sub) => {
      const valor = item[sub.nome]
      if (valor === null || valor === undefined || valor === '') return null
      return `${sub.label}: ${formatCampoValue(valor, sub, sub.nome)}`
    })
    .filter((linha): linha is string => linha !== null)
    .join('\n')
}

/**
 * Formata valor de campo conforme o tipo e o nome.
 *
 * Campos `tabela`/`grupo_repetivel` persistem array de objetos — cada item
 * vira um bloco legível usando os labels de `colunas`/`subcampos` do
 * formulário, em vez do JSON bruto que o proponente nunca preencheu como
 * texto (bug: campo com essas estruturas estourava a altura da linha no PDF
 * e sobrepunha o conteúdo seguinte — ver addTwoColumnRow em layout-helpers).
 */
export function formatCampoValue(value: unknown, campo: CampoFormulario | undefined, key: string): string {
  if (value === null || value === undefined || value === '') return '—'

  if (Array.isArray(value)) {
    if (value.length === 0) return '—'

    if (typeof value[0] === 'object' && value[0] !== null) {
      const subcampos = campo?.tipo === 'tabela' ? campo.colunas : campo?.subcampos
      const itens = value as Record<string, unknown>[]
      return itens
        .map((item, i) => {
          const prefixo = itens.length > 1 ? `${i + 1}. ` : ''
          const corpo = subcampos?.length
            ? formatarItemEstrutura(item, subcampos)
            // Sem definição de colunas/subcampos disponível — lista chave/valor bruta
            // como último recurso, ainda assim legível (nunca JSON.stringify aninhado).
            : Object.entries(item)
              .filter(([, v]) => v !== null && v !== undefined && v !== '')
              .map(([k, v]) => `${k}: ${v}`)
              .join('\n')
          return prefixo + corpo
        })
        .join('\n\n')
    }

    // Array de valores simples (multiselect / outras fontes etc.)
    return value.map(String).join('; ')
  }

  const tipo = campo?.tipo ?? 'texto'
  if (tipo === 'moeda' || tipo === 'currency') return formatCurrency(value)
  // Fallback: campo com "valor" no nome e valor numérico → formata como moeda
  if (key.toLowerCase().includes('valor') && !isNaN(Number(value))) return formatCurrency(value)
  if (tipo === 'data' || tipo === 'date') return formatDate(value)
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/** Status legíveis para anexos. */
function formatAnexoStatus(valido: boolean | null | undefined): string {
  if (valido === true) return 'Válido'
  if (valido === false) return 'Inválido'
  return 'Pendente'
}

/** Status legíveis para inscrição. */
const STATUS_LABELS: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  ENVIADA: 'Enviada',
  HABILITADA: 'Habilitada',
  INABILITADA: 'Inabilitada',
  EM_AVALIACAO: 'Em Avaliação',
  RESULTADO_PRELIMINAR: 'Resultado Preliminar',
  RECURSO_ABERTO: 'Recurso Aberto',
  RESULTADO_FINAL: 'Resultado Final',
  CONTEMPLADA: 'Contemplada',
  NAO_CONTEMPLADA: 'Não Contemplada',
  SUPLENTE: 'Suplente',
}

/**
 * Renderiza um campo de texto longo (textarea) com word wrap completo,
 * fazendo page break automático quando necessário.
 */
function addLongTextField(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
  ctx: PageContext,
  striped: boolean,
): void {
  const labelHeight = 14
  const textWidth = CONTENT_WIDTH - 8

  // Pré-calcular altura do texto
  doc.font('Helvetica').fontSize(8.5)
  const textHeight = doc.heightOfString(value || '—', { width: textWidth })
  const totalHeight = labelHeight + textHeight + 6

  checkPageBreak(doc, totalHeight, ctx)

  const y = doc.y

  // Fundo zebra (se necessário)
  if (striped) {
    doc.rect(MARGINS.left, y - 1, CONTENT_WIDTH, totalHeight + 2).fill('#f8fafc')
  }

  // Label
  doc
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .fillColor(COLORS.textLight)
    .text(label, MARGINS.left + 4, y, { width: CONTENT_WIDTH - 8 })

  // Valor com word wrap
  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(COLORS.text)
    .text(value || '—', MARGINS.left + 4, doc.y + 2, { width: textWidth })

  doc.y += 4
}

// ─── Geração do PDF ──────────────────────────────────────────────────────────

export async function generateProjetoCompleto(data: ProjetoCompletoData): Promise<Buffer> {
  const doc = createDocument()
  const ctx: PageContext = { pageNum: 1 }

  // ── Header ──────────────────────────────────────────────────────────────
  addCompactHeader(doc, 'Projeto Completo')
  addProtocolBadge(doc, data.numero)
  addDivider(doc)

  // ── Edital ──────────────────────────────────────────────────────────────
  checkPageBreak(doc, 80, ctx)
  addCompactSection(doc, 'Edital')
  addInfoBlock(doc, [
    { label: 'Título', value: data.edital.titulo },
    { label: 'Ano', value: String(data.edital.ano) },
    ...(data.categoria ? [{ label: 'Categoria', value: data.categoria }] : []),
    { label: 'Status da Inscrição', value: STATUS_LABELS[data.status] ?? data.status },
  ])
  addDivider(doc)

  // ── Proponente ──────────────────────────────────────────────────────────
  checkPageBreak(doc, 80, ctx)
  addCompactSection(doc, 'Proponente')
  addInfoBlock(doc, [
    { label: 'Nome', value: data.proponente.nome },
    { label: 'CPF/CNPJ', value: maskCpfCnpj(data.proponente.cpfCnpj) },
    { label: 'E-mail', value: data.proponente.email },
    { label: 'Tipo', value: formatTipoProponente(data.proponente.tipoProponente) },
  ])
  addDivider(doc)

  // ── Dados do Projeto ────────────────────────────────────────────────────
  const campoKeys = buildCampoKeys(data.campos, data.camposFormulario)
  if (campoKeys.length > 0) {
    checkPageBreak(doc, 30, ctx)
    addCompactSection(doc, 'Dados do Projeto')

    campoKeys.forEach((key, i) => {
      const campoDef = resolveCampoDef(key, data.camposFormulario)
      const label = resolveCampoLabel(key, data.camposFormulario)
      const value = data.campos[key]
      const formatted = formatCampoValue(value, campoDef, key)
      const striped = i % 2 === 0

      // Decide pelo tamanho do texto já formatado, não pelo tipo declarado do
      // campo — campos tabela/grupo_repetivel também podem virar texto longo
      // (várias linhas de equipe, cronograma, planilha orçamentária) e precisam
      // do mesmo cálculo de altura real que addLongTextField faz.
      if (formatted.length > 100) {
        addLongTextField(doc, label, formatted, ctx, striped)
      } else {
        checkPageBreak(doc, 20, ctx)
        addTwoColumnRow(doc, label, formatted, striped)
      }
    })

    addDivider(doc)
  }

  // ── Anexos ──────────────────────────────────────────────────────────────
  if (data.anexos.length > 0) {
    checkPageBreak(doc, 30 + data.anexos.length * 18, ctx)
    addCompactSection(doc, 'Anexos')
    addInfoBlock(
      doc,
      data.anexos.map((a) => ({
        label: a.titulo,
        value: `${a.tipo} — ${formatAnexoStatus(a.valido)}`,
      })),
    )
    addDivider(doc)
  }

  // ── Inscrição ───────────────────────────────────────────────────────────
  checkPageBreak(doc, 50, ctx)
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

  // ── Aviso legal ─────────────────────────────────────────────────────────
  checkPageBreak(doc, 40, ctx)
  addLegalNotice(
    doc,
    'Este documento é uma cópia para referência do projeto inscrito no edital acima referido. ' +
    'Os dados apresentados correspondem às informações registradas na plataforma no momento da inscrição. ' +
    'Para fins oficiais, consulte a plataforma do Portal PNAB Irecê.',
  )

  // ── Footer da última página ─────────────────────────────────────────────
  addCompactFooter(doc, ctx.pageNum)

  return docToBuffer(doc)
}

// ─── Helpers privados ────────────────────────────────────────────────────────

/**
 * Monta a lista ordenada de chaves de campos a exibir.
 * Prioriza a ordem definida em camposFormulario, depois campos órfãos.
 */
function buildCampoKeys(
  campos: Record<string, unknown>,
  camposFormulario: Array<{ nome: string }>,
): string[] {
  const allKeys = Object.keys(campos).filter(
    (k) => campos[k] !== null && campos[k] !== undefined && campos[k] !== '',
  )

  // Ordem definida pelo formulário
  const ordered = camposFormulario
    .map((cf) => cf.nome)
    .filter((nome) => allKeys.includes(nome))

  // Campos órfãos (preenchidos mas não no formulário)
  const orphans = allKeys.filter((k) => !ordered.includes(k))

  return [...ordered, ...orphans]
}
