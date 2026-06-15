import { generateComprovante } from '@server/lib/pdf/comprovante'
import { generateProjetoCompleto } from '@server/lib/pdf/projeto-completo'
import { InscricaoNaoEncontradaError } from '@server/modules/inscricoes/errors/inscricoes.errors'
import { documentosInscricaoRepository } from '../repository/documentos-inscricao.repository'
import { DocumentoIndisponivelError } from '../errors/documentos-inscricao.errors'

function parseCampos(raw: unknown): Record<string, unknown> {
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw)
    } catch {
      return {}
    }
  }
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>
  return {}
}

function assertAcesso(
  proponenteId: string,
  callerId: string,
  callerRole: string,
  status: string,
  mensagemIndisponivel: string,
) {
  const isOwner = proponenteId === callerId
  const isAdmin = callerRole === 'ADMIN'
  if (!isOwner && !isAdmin) throw new InscricaoNaoEncontradaError()
  if (status === 'RASCUNHO') throw new DocumentoIndisponivelError(mensagemIndisponivel)
}

export async function gerarComprovante(inscricaoId: string, callerId: string, callerRole: string) {
  const inscricao = await documentosInscricaoRepository.findParaComprovante(inscricaoId)
  if (!inscricao) throw new InscricaoNaoEncontradaError()
  assertAcesso(
    inscricao.proponente.id,
    callerId,
    callerRole,
    inscricao.status,
    'Comprovante disponível apenas para inscrições enviadas.',
  )

  const buffer = await generateComprovante({
    numero: inscricao.numero,
    proponente: {
      nome: inscricao.proponente.nome,
      cpfCnpj: inscricao.proponente.cpfCnpj ?? '',
      email: inscricao.proponente.email,
      tipoProponente: inscricao.proponente.tipoProponente ?? 'PF',
    },
    edital: inscricao.edital,
    categoria: inscricao.categoria,
    submittedAt: inscricao.submittedAt ?? inscricao.createdAt,
    campos: parseCampos(inscricao.campos),
  })

  return { buffer, filename: `comprovante-${inscricao.numero}.pdf` }
}

export async function gerarProjetoPdf(inscricaoId: string, callerId: string, callerRole: string) {
  const inscricao = await documentosInscricaoRepository.findParaProjeto(inscricaoId)
  if (!inscricao) throw new InscricaoNaoEncontradaError()
  assertAcesso(
    inscricao.proponente.id,
    callerId,
    callerRole,
    inscricao.status,
    'PDF disponível apenas para inscrições enviadas.',
  )

  const camposFormulario = Array.isArray(inscricao.edital.camposFormulario)
    ? (inscricao.edital.camposFormulario as Array<{ nome: string; label: string; tipo: string }>)
    : []

  const buffer = await generateProjetoCompleto({
    numero: inscricao.numero,
    status: inscricao.status,
    proponente: {
      nome: inscricao.proponente.nome,
      cpfCnpj: inscricao.proponente.cpfCnpj ?? '',
      email: inscricao.proponente.email,
      tipoProponente: inscricao.proponente.tipoProponente ?? 'PF',
    },
    edital: { titulo: inscricao.edital.titulo, ano: inscricao.edital.ano },
    categoria: inscricao.categoria,
    campos: parseCampos(inscricao.campos),
    camposFormulario,
    anexos: inscricao.anexos,
    submittedAt: inscricao.submittedAt ?? inscricao.createdAt,
  })

  return { buffer, filename: `projeto-${inscricao.numero}.pdf` }
}
