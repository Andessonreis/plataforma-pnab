import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getSignedUrl, uploadFile, deleteFile } from '@/lib/storage'
import { validateMagicBytes, sanitizeFilename } from '@/lib/upload/validate'
import {
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  ALLOWED_MIMES,
  MIME_LABEL,
} from '@/lib/upload/anexo-config'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'

export const runtime = 'nodejs'

const INTERNAL_ROLES = ['ADMIN', 'SUPER_ADMIN', 'HABILITADOR', 'AVALIADOR', 'ATENDIMENTO']

interface RouteParams {
  params: Promise<{ id: string }>
}

// ─── GET — Gerar signed URL para um anexo ──────────────────────────────────

export async function GET(req: NextRequest, { params }: RouteParams) {
  const requestId = randomUUID()
  const start = Date.now()
  const { id } = await params

  try {
    const session = await auth()
    if (!session || !INTERNAL_ROLES.includes(session.user.role)) {
      const res = NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Acesso negado.', requestId },
        { status: 401 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const anexoId = new URL(req.url).searchParams.get('anexoId')
    if (!anexoId) {
      const res = NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Parâmetro anexoId é obrigatório.', requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const anexo = await prisma.anexoInscricao.findUnique({
      where: { id: anexoId },
      select: { id: true, url: true, inscricaoId: true },
    })

    if (!anexo || anexo.inscricaoId !== id) {
      const res = NextResponse.json(
        { error: 'NOT_FOUND', message: 'Anexo não encontrado.', requestId },
        { status: 404 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // Link externo (vídeo por Drive/YouTube/etc.) — não está no nosso storage, usa a URL direto
    const urlObj = new URL(anexo.url)
    const storagePath = urlObj.pathname.split('/propostas/').pop()
    const isExternalLink = !urlObj.pathname.includes('/propostas/')

    const finalUrl = isExternalLink
      ? anexo.url
      : await getSignedUrl('propostas', storagePath as string, 3600)

    const res = NextResponse.json({ url: finalUrl, requestId })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({ requestId, method: 'GET', path: `/api/admin/inscricoes/${id}/anexos`, status: 200, durationMs: Date.now() - start })
    return res
  } catch (err) {
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    const res = NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro ao gerar URL do anexo.', requestId },
      { status: 500 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  }
}

// ─── POST — Secretaria junta documento em nome do proponente ────────────────
//
// Existe porque inscrição enviada não aceita mais anexo do proponente: quando
// uma retificação passa a exigir documento novo, o agente cultural manda por
// e-mail e a equipe junta ao processo aqui. Fica registrado quem juntou e por
// quê — o documento precisa se sustentar sozinho numa auditoria depois.
//
// Restrito a ADMIN e SUPER_ADMIN: habilitador confere, não junta prova.

export async function POST(req: NextRequest, { params }: RouteParams) {
  const requestId = randomUUID()
  const start = Date.now()
  const { id } = await params
  const path = `/api/admin/inscricoes/${id}/anexos`

  const erro = (status: number, code: string, message: string) => {
    const res = NextResponse.json({ error: code, message, requestId }, { status })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  }

  try {
    const session = await auth()
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return erro(403, 'FORBIDDEN', 'Apenas ADMIN pode juntar documento a uma inscrição.')
    }

    const inscricao = await prisma.inscricao.findUnique({
      where: { id },
      select: { id: true, numero: true },
    })
    if (!inscricao) return erro(404, 'NOT_FOUND', 'Inscrição não encontrada.')

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const tipo = (formData.get('tipo') as string | null)?.trim()
    const titulo = (formData.get('titulo') as string | null)?.trim()
    const origemNota = (formData.get('origemNota') as string | null)?.trim()

    if (!file || !tipo || !titulo) {
      return erro(400, 'BAD_REQUEST', 'Arquivo, tipo e título são obrigatórios.')
    }
    if (!origemNota || origemNota.length < 10) {
      return erro(400, 'BAD_REQUEST', 'Explique a origem do documento (mínimo 10 caracteres) — isso fica registrado no processo.')
    }

    // Mesmo MIME/tamanho aceitos do proponente; vídeo não se aplica aqui.
    let mimeType = file.type
    if (!mimeType || mimeType === 'application/octet-stream' || mimeType === 'application/x-pdf') {
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (ext === 'pdf') mimeType = 'application/pdf'
      else if (ext === 'png') mimeType = 'image/png'
      else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg'
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return erro(400, 'BAD_REQUEST', `Arquivo excede o limite de ${MAX_FILE_SIZE_MB}MB.`)
    }
    const mimesPermitidos: readonly string[] = ALLOWED_MIMES
    if (!mimesPermitidos.includes(mimeType)) {
      return erro(400, 'BAD_REQUEST', `Tipo de arquivo não permitido. Aceitos: ${MIME_LABEL}.`)
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    if (!validateMagicBytes(buffer, mimeType)) {
      return erro(400, 'BAD_REQUEST', 'Conteúdo do arquivo não corresponde ao tipo declarado.')
    }

    const safeName = sanitizeFilename(file.name)
    const storagePath = `inscricoes/${id}/secretaria/${Date.now()}_${safeName}`
    const url = await uploadFile('propostas', storagePath, buffer, mimeType)

    let anexo
    try {
      anexo = await prisma.anexoInscricao.create({
        data: {
          inscricaoId: id,
          tipo,
          titulo,
          url,
          adicionadoPorId: session.user.id,
          origemNota,
        },
        select: { id: true, tipo: true, titulo: true, createdAt: true },
      })
    } catch (dbError) {
      try {
        await deleteFile('propostas', storagePath)
      } catch {
        console.error({ requestId, message: 'Falha ao remover arquivo órfão do storage', storagePath })
      }
      throw dbError
    }

    await logAudit({
      userId: session.user.id,
      action: AUDIT_ACTIONS.ANEXO_ADICIONADO_PELA_EQUIPE,
      entity: 'AnexoInscricao',
      entityId: anexo.id,
      details: {
        inscricaoId: id,
        inscricaoNumero: inscricao.numero,
        tipo,
        titulo,
        filename: safeName,
        origemNota,
      },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const res = NextResponse.json({ data: anexo, requestId }, { status: 201 })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    console.log({ requestId, method: 'POST', path, status: 201, durationMs: Date.now() - start })
    return res
  } catch (err) {
    console.error({ requestId, path, error: err instanceof Error ? err.message : 'Unknown' })
    return erro(500, 'INTERNAL_ERROR', 'Erro ao juntar documento. Tente novamente.')
  }
}
