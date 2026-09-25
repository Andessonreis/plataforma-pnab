import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { descartarEmissao, registrarEmissao, type Emissao } from '@/lib/documentos/emissao'
import { identificacaoEdital, NOME_DO_TIPO } from '@/lib/documentos/titulos'
import {
  INCLUDE_PROJETO_COMPLETO, montarDadosProjeto, type InscricaoDoProjeto,
} from '@/lib/inscricoes/projeto-completo-dados'
import { juntarProjetos, type ProjetoDoLote } from '@/lib/pdf/dossie-completo'
import { generateProjetoCompleto } from '@/lib/pdf/projeto-completo'
import { montarClassificacao } from '@/lib/results/classificacao'
import { bonusVisivelPara, opcoesDaClassificacao } from '@/lib/results/classificacao-opcoes'
import { INSCRICOES_FORA_DA_CLASSIFICACAO } from '@/lib/results/resultado-publico'
import { ServiceError } from './errors'

interface EmitirProjetosContempladosInput {
  editalId: string
  /** Acrescenta, depois de cada projeto, os arquivos anexados pelo proponente. */
  incluirAnexos: boolean
  userId: string
  /** Define se a bonificação entra na nota que decide quem foi contemplado. */
  role: string
  ip?: string
}

export interface ProjetosContempladosEmitido {
  buffer: Buffer
  filename: string
  total: number
  /** Nulo quando o registro de emissão falhou; o PDF sai mesmo assim, sem código. */
  emissao: Emissao | null
}

/**
 * Gera os PDFs um a um conforme o consumidor pede. Um lote com anexos pode ter
 * centenas de páginas: manter todos os projetos gerados de antemão encheria a
 * memória sem necessidade.
 */
async function* projetosDoLote(
  inscricoes: InscricaoDoProjeto[],
  emissao: Emissao | null,
): AsyncGenerator<ProjetoDoLote> {
  for (const inscricao of inscricoes) {
    const pdf = await generateProjetoCompleto(
      montarDadosProjeto(inscricao, { status: inscricao.status, emissao }),
    )
    yield { pdf, anexos: inscricao.anexos }
  }
}

/**
 * Emite um único PDF com o projeto completo de cada contemplado, na ordem da
 * classificação (categoria e posição). Quem é contemplado sai do mesmo cálculo
 * da tela e do PDF de classificação, não do status gravado na inscrição, que
 * só muda quando o resultado é aplicado.
 */
export async function emitirProjetosContemplados(
  input: EmitirProjetosContempladosInput,
): Promise<ProjetosContempladosEmitido> {
  const { editalId, incluirAnexos, userId, role, ip } = input

  const edital = await prisma.edital.findUnique({
    where: { id: editalId },
    select: {
      titulo: true, ano: true, slug: true,
      vagasSuplentes: true, notaMinima: true, categoriasConfig: true, bonusVisivelParaAdmin: true,
    },
  })
  if (!edital) throw new ServiceError('NOT_FOUND', 'Edital não encontrado.')

  const categorias = await montarClassificacao(
    editalId,
    opcoesDaClassificacao(edital, bonusVisivelPara(role, edital)),
  )
  const ids = categorias
    .flatMap((categoria) => categoria.linhas)
    .filter((linha) => linha.status === 'CONTEMPLADA' && !INSCRICOES_FORA_DA_CLASSIFICACAO.includes(linha.numero))
    .map((linha) => linha.inscricaoId)
  if (ids.length === 0) {
    throw new ServiceError('BAD_REQUEST', 'Nenhum projeto contemplado na classificação deste edital.')
  }

  const carregadas = await prisma.inscricao.findMany({
    where: { id: { in: ids } },
    include: INCLUDE_PROJETO_COMPLETO,
  })
  const porId = new Map(carregadas.map((inscricao) => [inscricao.id, inscricao]))
  const inscricoes = ids.flatMap((id) => porId.get(id) ?? [])

  const emissao = await registrarEmissao({
    tipo: 'PROJETOS_CONTEMPLADOS',
    titulo: `${NOME_DO_TIPO.PROJETOS_CONTEMPLADOS} — ${identificacaoEdital(edital)}`,
    editalId,
    emitidoPorId: userId,
    conteudo: {
      edital: edital.titulo,
      ano: edital.ano,
      anexos: incluirAnexos,
      projetos: inscricoes.map((inscricao) => inscricao.numero),
    },
    metadados: {
      Contemplados: inscricoes.length,
      Anexos: incluirAnexos ? 'incluídos' : 'não incluídos',
    },
  })

  let buffer: Buffer
  try {
    buffer = await juntarProjetos(projetosDoLote(inscricoes, emissao), incluirAnexos)
  } catch (err) {
    // Sem PDF não há documento em circulação: o código não pode continuar valendo na verificação.
    if (emissao) await descartarEmissao(emissao.codigo)
    throw err
  }

  await logAudit({
    userId,
    action: 'EXPORTACAO_PROJETOS_CONTEMPLADOS',
    entity: 'Edital',
    entityId: editalId,
    details: {
      slug: edital.slug,
      contemplados: inscricoes.length,
      comAnexos: incluirAnexos,
      codigoEmissao: emissao?.codigo ?? null,
    },
    ip,
  })

  const dia = new Date().toISOString().slice(0, 10)
  const prefixo = incluirAnexos ? 'dossies-contemplados' : 'projetos-contemplados'
  return { buffer, filename: `${prefixo}_${edital.slug}_${dia}.pdf`, total: inscricoes.length, emissao }
}
