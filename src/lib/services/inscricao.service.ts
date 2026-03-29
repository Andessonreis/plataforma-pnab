import { prisma } from '@/lib/db'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'
import { enqueueEmail } from '@/lib/queue'
import { Prisma } from '@prisma/client'
import { ServiceError } from './errors'
import type { CreateInscricaoInput, UpdateInscricaoInput } from '@/lib/schemas/inscricao'

interface CampoFormulario {
  nome: string
  tipo: string
  obrigatorio?: boolean
  label?: string
}

export async function createInscricao(data: CreateInscricaoInput, userId: string, ip?: string) {
  const edital = await prisma.edital.findUnique({
    where: { id: data.editalId },
    select: { id: true, status: true, ano: true, categorias: true },
  })

  if (!edital) throw new ServiceError('NOT_FOUND', 'Edital não encontrado.')
  if (edital.status !== 'INSCRICOES_ABERTAS') {
    throw new ServiceError('FORBIDDEN', 'As inscrições para este edital não estão abertas.')
  }

  const existing = await prisma.inscricao.findFirst({
    where: { editalId: data.editalId, proponenteId: userId },
  })
  if (existing) throw new ServiceError('CONFLICT', 'Você já possui uma inscrição neste edital.')

  if (data.categoria && edital.categorias.length > 0 && !edital.categorias.includes(data.categoria)) {
    throw new ServiceError('BAD_REQUEST', 'Categoria inválida para este edital.')
  }

  let inscricao!: { id: string; numero: string }
  for (let attempt = 0; attempt < 3; attempt++) {
    const count = await prisma.inscricao.count({
      where: { numero: { startsWith: `PNAB-${edital.ano}-` } },
    })
    const numero = `PNAB-${edital.ano}-${String(count + 1).padStart(4, '0')}`

    try {
      inscricao = await prisma.inscricao.create({
        data: {
          numero,
          editalId: data.editalId,
          proponenteId: userId,
          status: 'RASCUNHO',
          categoria: data.categoria ?? null,
          campos: {},
        },
        select: { id: true, numero: true },
      })
      break
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002' && attempt < 2) {
        continue
      }
      throw e
    }
  }

  await logAudit({
    userId,
    action: AUDIT_ACTIONS.INSCRICAO_CRIADA,
    entity: 'Inscricao',
    entityId: inscricao.id,
    details: { editalId: data.editalId, numero: inscricao.numero },
    ip,
  })

  return inscricao
}

export async function updateInscricao(id: string, data: UpdateInscricaoInput, userId: string) {
  const inscricao = await prisma.inscricao.findUnique({
    where: { id },
    select: { id: true, proponenteId: true, status: true, editalId: true },
  })

  if (!inscricao) throw new ServiceError('NOT_FOUND', 'Inscrição não encontrada.')
  if (inscricao.proponenteId !== userId) throw new ServiceError('FORBIDDEN', 'Acesso negado.')
  if (inscricao.status !== 'RASCUNHO') throw new ServiceError('FORBIDDEN', 'Apenas rascunhos podem ser editados.')

  if (data.categoria !== undefined) {
    const edital = await prisma.edital.findUnique({
      where: { id: inscricao.editalId },
      select: { categorias: true },
    })
    if (edital && edital.categorias.length > 0 && data.categoria && !edital.categorias.includes(data.categoria)) {
      throw new ServiceError('BAD_REQUEST', 'Categoria inválida para este edital.')
    }
  }

  const updateData: Record<string, unknown> = {}
  if (data.campos !== undefined) updateData.campos = data.campos
  if (data.categoria !== undefined) updateData.categoria = data.categoria || null
  if (data.orcamento !== undefined) updateData.orcamento = data.orcamento

  return prisma.inscricao.update({
    where: { id },
    data: updateData,
    include: {
      edital: { select: { id: true, titulo: true, categorias: true, camposFormulario: true } },
      anexos: { orderBy: { createdAt: 'asc' } },
    },
  })
}

export async function submitInscricao(id: string, userId: string, ip?: string) {
  const inscricao = await prisma.inscricao.findUnique({
    where: { id },
    include: {
      edital: { select: { id: true, titulo: true, status: true, categorias: true, camposFormulario: true } },
      anexos: true,
      proponente: { select: { email: true, nome: true } },
    },
  })

  if (!inscricao) throw new ServiceError('NOT_FOUND', 'Inscrição não encontrada.')
  if (inscricao.proponenteId !== userId) throw new ServiceError('FORBIDDEN', 'Acesso negado.')
  if (inscricao.status !== 'RASCUNHO') throw new ServiceError('FORBIDDEN', 'Esta inscrição já foi enviada.')
  if (inscricao.edital.status !== 'INSCRICOES_ABERTAS') {
    throw new ServiceError('FORBIDDEN', 'O prazo de inscrições para este edital foi encerrado.')
  }

  if (inscricao.edital.categorias.length > 0 && !inscricao.categoria) {
    throw new ServiceError('BAD_REQUEST', 'Selecione uma categoria antes de enviar.')
  }

  // Valida campos obrigatórios
  const camposFormulario = (inscricao.edital.camposFormulario as unknown as CampoFormulario[]) || []
  const campos = (inscricao.campos as Record<string, unknown>) || {}
  const camposFaltando: string[] = []

  for (const campo of camposFormulario) {
    if (campo.obrigatorio && campo.tipo !== 'arquivo') {
      const valor = campos[campo.nome]
      if (valor === undefined || valor === null || valor === '') {
        camposFaltando.push(campo.label || campo.nome)
      }
    }
  }

  if (camposFaltando.length > 0) {
    throw new ServiceError('BAD_REQUEST', `Campos obrigatórios não preenchidos: ${camposFaltando.join(', ')}`)
  }

  if (inscricao.anexos.length === 0) {
    throw new ServiceError('BAD_REQUEST', 'Envie pelo menos um anexo antes de submeter.')
  }

  const now = new Date()
  const updated = await prisma.inscricao.update({
    where: { id },
    data: { status: 'ENVIADA', submittedAt: now },
    select: { numero: true, submittedAt: true },
  })

  await logAudit({
    userId,
    action: AUDIT_ACTIONS.INSCRICAO_ENVIADA,
    entity: 'Inscricao',
    entityId: id,
    details: { numero: updated.numero, editalId: inscricao.editalId },
    ip,
  })

  try {
    await enqueueEmail({
      to: inscricao.proponente.email,
      subject: `Inscrição ${updated.numero} enviada com sucesso`,
      template: 'comprovante_inscricao',
      data: {
        nome: inscricao.proponente.nome,
        numero: updated.numero,
        edital: inscricao.edital.titulo,
        submittedAt: now.toISOString(),
      },
    })
  } catch {
    console.error('[inscricao] Falha ao enfileirar e-mail de confirmação')
  }

  return updated
}

export async function getInscricaoById(id: string, callerId: string, callerRole: string) {
  const inscricao = await prisma.inscricao.findUnique({
    where: { id },
    include: {
      edital: { select: { id: true, titulo: true, slug: true, categorias: true, camposFormulario: true, status: true } },
      anexos: { orderBy: { createdAt: 'asc' } },
      proponente: { select: { id: true, nome: true } },
    },
  })

  if (!inscricao) throw new ServiceError('NOT_FOUND', 'Inscrição não encontrada.')

  const isOwner = inscricao.proponenteId === callerId
  const isAdmin = callerRole === 'ADMIN'
  if (!isOwner && !isAdmin) throw new ServiceError('FORBIDDEN', 'Acesso negado.')

  return inscricao
}

export async function listInscricoesByProponente(userId: string, page: number, pageSize: number) {
  const where = { proponenteId: userId }
  const [data, total] = await Promise.all([
    prisma.inscricao.findMany({
      where,
      include: {
        edital: { select: { titulo: true, slug: true } },
        _count: { select: { anexos: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.inscricao.count({ where }),
  ])

  return { data, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } }
}

export async function listInscricoesAdmin(page: number, pageSize: number, editalId?: string, status?: string) {
  const where: Record<string, unknown> = {}
  if (editalId) where.editalId = editalId
  if (status) where.status = status

  const [data, total] = await Promise.all([
    prisma.inscricao.findMany({
      where,
      include: {
        edital: { select: { titulo: true } },
        proponente: { select: { nome: true, cpfCnpj: true } },
        _count: { select: { avaliacoes: true, recursos: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.inscricao.count({ where }),
  ])

  return { data, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } }
}
