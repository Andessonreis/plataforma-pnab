/**
 * Projeto completo da inscrição — todas as seções preenchidas pelo proponente.
 *
 * É a cópia de referência arquivada pela Secretaria e a base do dossiê que
 * recebe os anexos originais mesclados.
 */
import { formatCpfCnpj } from '@/lib/utils/format'
import type { CampoFormulario } from '@/types/campo-formulario'
import type { Emissao } from '@/lib/documentos/emissao'
import { NOME_DO_PROJETO, type VersaoProjeto } from '@/lib/documentos/titulos'
import {
  addProtocolBadge, addCompactSection, addInfoBlock, addDivider, addLegalNotice,
} from '../layout-helpers'
import { criarDocumentoOficial, finalizarDocumento, garantirEspaco } from '../documento-oficial'
import { CORES, FONTES, LARGURA_UTIL, X_ESQUERDA, LIMITE_CONTEUDO } from '../documento-oficial/tema'
import { novaPagina } from '../documento-oficial/pagina'
import {
  buildCampoKeys, formatCampoValue, formatTipoProponente,
  resolveCampoDef, resolveCampoLabel, STATUS_LABELS,
} from './formatacao'

export { formatCampoValue }

/**
 * Quem responde por uma inscrição feita em nome de entidade (CNPJ ou grupo). O formulário não coleta
 * esses dados: saem do documento pessoal anexado e só entram quando quem gera o PDF os informa.
 */
export interface ResponsavelDoProjeto {
  nome: string
  cpf: string
  rg?: string | null
  dataNascimento?: string | null
}

export interface ProjetoCompletoData {
  numero: string
  status: string
  /** Padrão `completo`. */
  versao?: VersaoProjeto
  proponente: {
    nome: string
    cpfCnpj: string
    /** RG e data de nascimento de quem consta no cadastro; só saem quando quem gera o PDF os informa. */
    rg?: string | null
    dataNascimento?: string | null
    responsavel?: ResponsavelDoProjeto
    email: string
    tipoProponente: string
  }
  edital: { titulo: string; ano: number }
  categoria?: string | null
  campos: Record<string, unknown>
  camposFormulario: CampoFormulario[]
  anexos: Array<{ titulo: string; tipo: string; valido?: boolean | null }>
  submittedAt: Date
  /** Registro de emissão; null quando o registro falhou (o PDF sai mesmo assim). */
  emissao?: Emissao | null
}

/** A partir deste tamanho o valor não cabe numa linha de ficha e vira bloco. */
const LIMITE_LINHA = 100

/**
 * Campo de texto longo: rótulo no alto da moldura e o valor corrido abaixo,
 * com a altura medida antes de desenhar. Resposta de textarea, planilha
 * orçamentária e cronograma passam por aqui — numa linha de ficha o texto
 * vazaria por cima do campo seguinte.
 */
function desenharCampoLongo(doc: PDFKit.PDFDocument, rotulo: string, valor: string): void {
  const larguraTexto = LARGURA_UTIL - 12
  doc.font(FONTES.dado).fontSize(8.5)
  const altura = doc.heightOfString(valor || '—', { width: larguraTexto }) + 26

  if (doc.y + altura > LIMITE_CONTEUDO) novaPagina(doc)

  const topo = doc.y
  doc.save()
  doc.rect(X_ESQUERDA, topo, LARGURA_UTIL, altura).strokeColor(CORES.fio).lineWidth(0.7).stroke()
  doc.restore()

  doc.font(FONTES.rotulo).fontSize(8.5).fillColor(CORES.tinta)
    .text(rotulo, X_ESQUERDA + 6, topo + 5, { width: larguraTexto, lineBreak: false, ellipsis: true })
  doc.font(FONTES.dado).fontSize(8.5).fillColor(CORES.texto)
    .text(valor || '—', X_ESQUERDA + 6, topo + 18, { width: larguraTexto })

  doc.y = topo + altura + 4
}

/** Seção "Dados do Projeto" — cada campo do formulário na ordem do edital. */
function desenharCampos(doc: PDFKit.PDFDocument, data: ProjetoCompletoData): void {
  const chaves = buildCampoKeys(data.campos, data.camposFormulario)
  if (chaves.length === 0) return

  garantirEspaco(doc, 40)
  addCompactSection(doc, 'Dados do projeto')

  for (const chave of chaves) {
    const definicao = resolveCampoDef(chave, data.camposFormulario)
    const rotulo = resolveCampoLabel(chave, data.camposFormulario)
    const valor = formatCampoValue(data.campos[chave], definicao, chave)

    if (valor.length > LIMITE_LINHA) {
      desenharCampoLongo(doc, rotulo, valor)
    } else {
      garantirEspaco(doc, 24)
      addInfoBlock(doc, [{ label: rotulo, value: valor }])
    }
  }

  addDivider(doc)
}

/**
 * Os rótulos precisam caber numa linha da ficha (cerca de 22 caracteres): um rótulo maior quebra e a
 * segunda linha cobre o campo de baixo.
 */
function linhasDoResponsavel(responsavel: ResponsavelDoProjeto): Array<{ label: string; value: string }> {
  return [
    { label: 'Responsável', value: responsavel.nome },
    { label: 'CPF do responsável', value: formatCpfCnpj(responsavel.cpf) },
    ...(responsavel.rg ? [{ label: 'RG do responsável', value: responsavel.rg }] : []),
    ...(responsavel.dataNascimento ? [{ label: 'Nasc. do responsável', value: responsavel.dataNascimento }] : []),
  ]
}

export async function generateProjetoCompleto(data: ProjetoCompletoData): Promise<Buffer> {
  const nome = NOME_DO_PROJETO[data.versao ?? 'completo']
  const doc = await criarDocumentoOficial({
    rotulo: nome.rotulo,
    titulo: nome.titulo,
    subtitulo: `${data.edital.titulo} · ${data.edital.ano}`,
    emissao: data.emissao ?? null,
  })

  addProtocolBadge(doc, data.numero)

  garantirEspaco(doc, 90)
  addCompactSection(doc, 'Edital')
  addInfoBlock(doc, [
    { label: 'Título', value: data.edital.titulo },
    { label: 'Ano', value: String(data.edital.ano) },
    ...(data.categoria ? [{ label: 'Categoria', value: data.categoria }] : []),
    { label: 'Situação da inscrição', value: STATUS_LABELS[data.status] ?? data.status },
  ])
  addDivider(doc)

  garantirEspaco(doc, 90)
  addCompactSection(doc, 'Proponente')
  addInfoBlock(doc, [
    { label: 'Nome', value: data.proponente.nome },
    { label: 'CPF/CNPJ', value: formatCpfCnpj(data.proponente.cpfCnpj) },
    ...(data.proponente.rg ? [{ label: 'RG', value: data.proponente.rg }] : []),
    ...(data.proponente.dataNascimento ? [{ label: 'Data de nascimento', value: data.proponente.dataNascimento }] : []),
    ...(data.proponente.responsavel ? linhasDoResponsavel(data.proponente.responsavel) : []),
    { label: 'E-mail', value: data.proponente.email },
    { label: 'Tipo', value: formatTipoProponente(data.proponente.tipoProponente) },
  ])
  addDivider(doc)

  desenharCampos(doc, data)

  garantirEspaco(doc, 60)
  addCompactSection(doc, 'Inscrição')
  addInfoBlock(doc, [
    {
      label: 'Data de envio',
      value: data.submittedAt.toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
      }),
    },
    { label: 'Protocolo', value: data.numero },
  ])

  garantirEspaco(doc, 60)
  addLegalNotice(
    doc,
    'Este documento é uma cópia para referência do projeto inscrito no edital acima referido. '
    + 'Os dados apresentados correspondem às informações registradas na plataforma no momento da '
    + 'inscrição. Para fins oficiais, consulte a plataforma do Portal PNAB Irecê.',
  )

  return finalizarDocumento(doc, [
    { rotulo: 'Documento', valor: nome.rotulo },
    { rotulo: 'Edital', valor: `${data.edital.titulo} (${data.edital.ano})` },
    { rotulo: 'Inscrição', valor: data.numero },
    { rotulo: 'Proponente', valor: data.proponente.nome },
    { rotulo: 'Anexos', valor: String(data.anexos.length) },
  ])
}
