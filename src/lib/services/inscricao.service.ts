import { prisma } from '@/lib/db'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'
import { enqueueEmail } from '@/lib/queue'
import { Prisma } from '@prisma/client'
import { ServiceError } from './errors'
import { resolveCharLimits } from '@/lib/campo-limits'
import { filterCamposByTipo, type CampoFormulario } from '@/types/campo-formulario'
import { invalidCotasOptIn, type CategoriaConfig } from '@/types/categoria-config'
import type { CreateInscricaoInput, UpdateInscricaoInput } from '@/lib/schemas/inscricao'

export async function createInscricao(data: CreateInscricaoInput, userId: string, ip?: string) {
  const edital = await prisma.edital.findUnique({
    where: { id: data.editalId },
    select: { id: true, status: true, ano: true, categorias: true, categoriasConfig: true },
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

  const cotasInvalidas = invalidCotasOptIn(
    edital.categoriasConfig as unknown as CategoriaConfig[] | null,
    data.categoria,
    data.cotasOptIn,
  )
  if (cotasInvalidas.length > 0) {
    throw new ServiceError('BAD_REQUEST', `Cota inválida para esta categoria: ${cotasInvalidas.join(', ')}`)
  }

  let inscricao!: { id: string; numero: string }
  const lastInscricao = await prisma.inscricao.findFirst({
    where: { numero: { startsWith: `PNAB-${edital.ano}-` } },
    orderBy: { numero: 'desc' },
    select: { numero: true },
  })
  let lastSeq = 0
  if (lastInscricao?.numero) {
    const parts = lastInscricao.numero.split('-')
    const num = parseInt(parts[parts.length - 1], 10)
    if (!isNaN(num)) lastSeq = num
  }
  const count = await prisma.inscricao.count({
    where: { numero: { startsWith: `PNAB-${edital.ano}-` } },
  })
  const baseSeq = Math.max(lastSeq, count)

  for (let attempt = 0; attempt < 5; attempt++) {
    const numero = `PNAB-${edital.ano}-${String(baseSeq + 1 + attempt).padStart(4, '0')}`

    try {
      inscricao = await prisma.inscricao.create({
        data: {
          numero,
          editalId: data.editalId,
          proponenteId: userId,
          status: 'RASCUNHO',
          categoria: data.categoria ?? null,
          cotasOptIn: data.cotasOptIn,
          campos: {},
        },
        select: { id: true, numero: true },
      })
      break
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002' && attempt < 4) {
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
    select: { id: true, proponenteId: true, status: true, editalId: true, categoria: true },
  })

  if (!inscricao) throw new ServiceError('NOT_FOUND', 'Inscrição não encontrada.')
  if (inscricao.proponenteId !== userId) throw new ServiceError('FORBIDDEN', 'Acesso negado.')
  if (inscricao.status !== 'RASCUNHO') throw new ServiceError('FORBIDDEN', 'Apenas rascunhos podem ser editados.')

  if (data.categoria !== undefined || data.cotasOptIn !== undefined) {
    const edital = await prisma.edital.findUnique({
      where: { id: inscricao.editalId },
      select: { categorias: true, categoriasConfig: true },
    })
    if (edital && edital.categorias.length > 0 && data.categoria && !edital.categorias.includes(data.categoria)) {
      throw new ServiceError('BAD_REQUEST', 'Categoria inválida para este edital.')
    }

    const categoriaEfetiva = data.categoria !== undefined ? data.categoria : inscricao.categoria
    const cotasInvalidas = invalidCotasOptIn(
      edital?.categoriasConfig as unknown as CategoriaConfig[] | null,
      categoriaEfetiva,
      data.cotasOptIn ?? [],
    )
    if (cotasInvalidas.length > 0) {
      throw new ServiceError('BAD_REQUEST', `Cota inválida para esta categoria: ${cotasInvalidas.join(', ')}`)
    }
  }

  const updateData: Record<string, unknown> = {}
  if (data.campos !== undefined) updateData.campos = data.campos
  if (data.categoria !== undefined) updateData.categoria = data.categoria || null
  if (data.cotasOptIn !== undefined) updateData.cotasOptIn = data.cotasOptIn
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
      edital: {
        select: {
          id: true, titulo: true, status: true, categorias: true,
          camposFormulario: true, etapasCustomizadas: true,
        },
      },
      anexos: true,
      proponente: { select: { email: true, nome: true, tipoProponente: true } },
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

  // Valida campos obrigatórios (dados + etapas customizadas), filtrados por tipo de proponente
  const allCampos = (inscricao.edital.camposFormulario as unknown as CampoFormulario[]) || []
  const etapas = Array.isArray(inscricao.edital.etapasCustomizadas)
    ? (inscricao.edital.etapasCustomizadas as unknown as Array<{ campos: CampoFormulario[] }>)
    : []
  const camposDeEtapas = etapas.flatMap((e) => e.campos || [])
  // Top-level: filtra por tipo de proponente. Inclui tipos estruturais (tabela/grupo/info)
  const todosTopLevel = filterCamposByTipo(
    [...allCampos, ...camposDeEtapas],
    inscricao.proponente.tipoProponente,
  )
  const campos = (inscricao.campos as Record<string, unknown>) || {}
  const camposFaltando: string[] = []

  // Validação recursiva: tipos simples, tabelas (cada linha) e grupos repetíveis (cada item)
  for (const campo of todosTopLevel) {
    if (campo.tipo === 'info' || campo.tipo === 'arquivo') continue

    if (campo.tipo === 'tabela') {
      const linhas = Array.isArray(campos[campo.nome]) ? (campos[campo.nome] as Record<string, unknown>[]) : []
      if (campo.obrigatorio && linhas.length === 0) {
        camposFaltando.push(campo.label || campo.nome)
        continue
      }
      if ((campo.linhaMin ?? 0) > linhas.length) {
        camposFaltando.push(`${campo.label || campo.nome} (mínimo ${campo.linhaMin} linhas)`)
        continue
      }
      for (let i = 0; i < linhas.length; i++) {
        for (const col of campo.colunas ?? []) {
          if (col.obrigatorio) {
            const v = linhas[i]?.[col.nome]
            if (v === undefined || v === null || v === '') {
              camposFaltando.push(`${campo.label || campo.nome} — linha ${i + 1}: ${col.label || col.nome}`)
            }
          }
        }
      }
      continue
    }

    if (campo.tipo === 'grupo_repetivel') {
      const itens = Array.isArray(campos[campo.nome]) ? (campos[campo.nome] as Record<string, unknown>[]) : []
      if (campo.obrigatorio && itens.length === 0) {
        camposFaltando.push(campo.label || campo.nome)
        continue
      }
      if ((campo.itemMin ?? 0) > itens.length) {
        camposFaltando.push(`${campo.label || campo.nome} (mínimo ${campo.itemMin} itens)`)
        continue
      }
      const labelItem = campo.labelItem || 'item'
      for (let i = 0; i < itens.length; i++) {
        for (const sub of campo.subcampos ?? []) {
          if (sub.obrigatorio) {
            const v = itens[i]?.[sub.nome]
            if (v === undefined || v === null || v === '') {
              camposFaltando.push(`${campo.label || campo.nome} — ${labelItem} ${i + 1}: ${sub.label || sub.nome}`)
            }
          }
        }
      }
      continue
    }

    // tipos simples
    if (campo.obrigatorio) {
      const valor = campos[campo.nome]
      if (valor === undefined || valor === null || valor === '') {
        camposFaltando.push(campo.label || campo.nome)
      }
    }
  }

  // Para validação de limites de caracteres abaixo, só considera tipos simples (folha)
  const camposFormulario = todosTopLevel.filter(
    (c) => c.tipo !== 'info' && c.tipo !== 'tabela' && c.tipo !== 'grupo_repetivel',
  )

  if (camposFaltando.length > 0) {
    throw new ServiceError('BAD_REQUEST', `Campos obrigatórios não preenchidos: ${camposFaltando.join(', ')}`)
  }

  // Valida limites de caracteres
  const camposExcedidos: string[] = []
  const camposCurtos: string[] = []

  for (const campo of camposFormulario) {
    if (campo.tipo === 'arquivo') continue
    const valor = campos[campo.nome]
    if (valor === undefined || valor === null || valor === '') continue

    const limits = resolveCharLimits(campo)
    if (!limits) continue

    const strValue = String(valor)
    if (strValue.length > limits.maxLength) {
      camposExcedidos.push(`${campo.label || campo.nome} (máx. ${limits.maxLength})`)
    }
    if (limits.minLength > 0 && strValue.length < limits.minLength) {
      camposCurtos.push(`${campo.label || campo.nome} (mín. ${limits.minLength})`)
    }
  }

  if (camposExcedidos.length > 0) {
    throw new ServiceError('BAD_REQUEST', `Campos excedem o limite de caracteres: ${camposExcedidos.join(', ')}`)
  }
  if (camposCurtos.length > 0) {
    throw new ServiceError('BAD_REQUEST', `Campos abaixo do mínimo de caracteres: ${camposCurtos.join(', ')}`)
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
