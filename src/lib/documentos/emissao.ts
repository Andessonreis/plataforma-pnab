import { createHash, randomBytes } from 'crypto'
import { prisma } from '@/lib/db'

/**
 * Emissão verificável de documento oficial.
 *
 * O que se registra aqui é **prova de emissão**: o documento sai com um código
 * e um QR que levam a uma página pública do portal dizendo o que foi emitido,
 * quando, por qual órgão e sobre qual edital.
 *
 * O hash é dos **dados** que geraram o documento, não do PDF. O arquivo muda a
 * cada geração (data impressa no rodapé, metadados do PDFKit), então um hash
 * do binário acusaria adulteração em duas emissões idênticas. Com o hash dos
 * dados, reemitir o mesmo conteúdo dá o mesmo hash e a página de verificação
 * consegue dizer se o que está no papel bate com o que o portal gerou.
 */

/** Tipos de documento que o portal emite. O valor vai gravado e aparece na verificação. */
export const TIPOS_DOCUMENTO = {
  CLASSIFICACAO: 'Classificação por categoria',
  LISTA_INSCRICOES: 'Lista de inscrições',
  LISTA_AGENTES: 'Relação de agentes culturais',
  LISTA_RESULTADO: 'Resultado do edital',
  RELATORIO_FINAL: 'Relatório final do edital',
  RELATORIO_RECURSOS: 'Relatório de recursos interpostos',
  DOSSIE_INSCRICAO: 'Dossiê da inscrição',
  PROJETO_COMPLETO: 'Projeto completo',
  COMPROVANTE_INSCRICAO: 'Comprovante de inscrição',
  DECLARACAO: 'Declaração',
} as const

export type TipoDocumento = keyof typeof TIPOS_DOCUMENTO

export interface Emissao {
  codigo: string
  emitidoEm: Date
  /** URL absoluta impressa no rodapé e codificada no QR. */
  urlVerificacao: string
  hashConteudo: string
}

export interface RegistrarEmissaoInput {
  tipo: TipoDocumento
  /** Título legível — ex.: "Classificação — Festival de Arte e Cultura (2026)". */
  titulo: string
  editalId?: string | null
  emitidoPorId?: string | null
  /** Dados que geraram o documento; viram o hash. */
  conteudo: unknown
  /** Resumo exibido na verificação (totais, fase). Nunca dado pessoal. */
  metadados?: Record<string, unknown>
}

// Sem I, O, 0 e 1: o código é lido em voz alta e digitado à mão por quem
// recebeu o documento impresso.
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function bloco(tamanho: number): string {
  const bytes = randomBytes(tamanho)
  return Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]).join('')
}

/** Código no formato PNAB-XXXX-XXXX. */
export function gerarCodigo(): string {
  return `PNAB-${bloco(4)}-${bloco(4)}`
}

/** SHA-256 estável dos dados: chaves ordenadas para o mesmo conteúdo dar o mesmo hash. */
export function hashConteudo(conteudo: unknown): string {
  return createHash('sha256').update(serializarEstavel(conteudo)).digest('hex')
}

function serializarEstavel(valor: unknown): string {
  if (valor === null || typeof valor !== 'object') return JSON.stringify(valor) ?? 'null'
  if (Array.isArray(valor)) return `[${valor.map(serializarEstavel).join(',')}]`
  const entradas = Object.entries(valor as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${JSON.stringify(k)}:${serializarEstavel(v)}`)
  return `{${entradas.join(',')}}`
}

function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://culturaeturismo.irece.ba.gov.br').replace(/\/$/, '')
}

export function urlVerificacao(codigo: string): string {
  return `${baseUrl()}/verificar/${codigo}`
}

/**
 * Grava a emissão e devolve o que o PDF precisa imprimir.
 *
 * Nunca derruba a geração do documento: se o registro falhar, o PDF ainda sai,
 * sem código de verificação. Um relatório que a Secretaria precisa agora vale
 * mais do que a prova de emissão dele.
 */
export async function registrarEmissao(input: RegistrarEmissaoInput): Promise<Emissao | null> {
  const hash = hashConteudo(input.conteudo)

  for (let tentativa = 0; tentativa < 3; tentativa++) {
    const codigo = gerarCodigo()
    try {
      const registro = await prisma.documentoEmitido.create({
        data: {
          codigo,
          tipo: input.tipo,
          titulo: input.titulo,
          hashConteudo: hash,
          metadados: (input.metadados ?? {}) as object,
          editalId: input.editalId ?? null,
          emitidoPorId: input.emitidoPorId ?? null,
        },
        select: { codigo: true, emitidoEm: true },
      })
      return {
        codigo: registro.codigo,
        emitidoEm: registro.emitidoEm,
        urlVerificacao: urlVerificacao(registro.codigo),
        hashConteudo: hash,
      }
    } catch (err) {
      // Colisão de código é improvável mas possível — tenta outro.
      const colisao = err instanceof Error && err.message.includes('Unique constraint')
      if (!colisao) {
        console.error({ escopo: 'registrarEmissao', erro: err instanceof Error ? err.message : 'desconhecido' })
        return null
      }
    }
  }

  console.error({ escopo: 'registrarEmissao', erro: 'três colisões de código seguidas' })
  return null
}

/**
 * Apaga a emissão de um documento que não chegou a ser gerado.
 *
 * Sem isso o código continuaria valendo na página de verificação sem que
 * exista PDF algum. Falha na limpeza só é registrada: não pode mascarar o erro
 * que levou ao descarte.
 */
export async function descartarEmissao(codigo: string): Promise<void> {
  try {
    await prisma.documentoEmitido.deleteMany({ where: { codigo } })
  } catch (err) {
    console.error({ escopo: 'descartarEmissao', erro: err instanceof Error ? err.message : 'desconhecido' })
  }
}
