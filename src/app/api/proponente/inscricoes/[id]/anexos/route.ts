import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { uploadFile, deleteFile } from '@/lib/storage'
import { validateMagicBytes, sanitizeFilename } from '@/lib/upload/validate'
import {
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  ALLOWED_MIMES,
  MIME_LABEL,
  MAX_VIDEO_SIZE_BYTES,
  MAX_VIDEO_SIZE_MB,
  ALLOWED_VIDEO_MIMES,
  VIDEO_MIME_LABEL,
  VIDEO_ANEXO_TIPOS,
} from '@/lib/upload/anexo-config'
import { logAudit } from '@/lib/audit'

export const runtime = 'nodejs'

interface RouteParams {
  params: Promise<{ id: string }>
}

// ─── POST — Upload de anexo ─────────────────────────────────────────────────

export async function POST(req: NextRequest, { params }: RouteParams) {
  const requestId = randomUUID()
  const start = Date.now()
  const { id } = await params

  try {
    const session = await auth()
    if (!session || session.user.role !== 'PROPONENTE') {
      const res = NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Acesso negado.', requestId },
        { status: 401 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const inscricao = await prisma.inscricao.findUnique({
      where: { id },
      select: {
        id: true,
        proponenteId: true,
        status: true,
        edital: { select: { videoHabilitado: true } },
      },
    })

    if (!inscricao) {
      const res = NextResponse.json(
        { error: 'NOT_FOUND', message: 'Inscrição não encontrada.', requestId },
        { status: 404 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    if (inscricao.proponenteId !== session.user.id) {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso negado.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    if (inscricao.status !== 'RASCUNHO') {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'Apenas rascunhos podem receber anexos.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const videoUrl = formData.get('url') as string | null
    const tipo = formData.get('tipo') as string | null
    const titulo = formData.get('titulo') as string | null

    if ((!file && !videoUrl) || !tipo || !titulo) {
      const res = NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Campos file (ou url) e tipo/titulo são obrigatórios.', requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // Vídeo (substitutivo ou complementar) só é aceito quando o edital libera a etapa de vídeo
    const isVideoTipo = (tipo === VIDEO_ANEXO_TIPOS.substitutivo || tipo === VIDEO_ANEXO_TIPOS.complementar)
    if (isVideoTipo && !inscricao.edital.videoHabilitado) {
      const res = NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Este edital não aceita anexo de vídeo.', requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // Link de vídeo (Drive/YouTube/etc.) — sem upload, só valida a URL e cria o registro
    if (!file && videoUrl) {
      if (!isVideoTipo) {
        const res = NextResponse.json(
          { error: 'BAD_REQUEST', message: 'Anexo por link só é aceito para vídeo.', requestId },
          { status: 400 },
        )
        res.headers.set('X-Request-Id', requestId)
        res.headers.set('Cache-Control', 'no-store')
        return res
      }

      if (!/^https:\/\/.+/i.test(videoUrl)) {
        const res = NextResponse.json(
          { error: 'BAD_REQUEST', message: 'Informe um link de vídeo válido (https://...).', requestId },
          { status: 400 },
        )
        res.headers.set('X-Request-Id', requestId)
        res.headers.set('Cache-Control', 'no-store')
        return res
      }

      const anexoLink = await prisma.anexoInscricao.create({
        data: { inscricaoId: id, tipo, titulo, url: videoUrl },
        select: { id: true, url: true, titulo: true, tipo: true, createdAt: true },
      })

      await logAudit({
        userId: session.user.id,
        action: 'ANEXO_ENVIADO',
        entity: 'AnexoInscricao',
        entityId: anexoLink.id,
        details: { inscricaoId: id, tipo, url: videoUrl },
        ip: req.headers.get('x-forwarded-for') ?? undefined,
      })

      const res = NextResponse.json({ data: anexoLink, requestId }, { status: 201 })
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')

      console.log({ requestId, method: 'POST', path: `/api/proponente/inscricoes/${id}/anexos`, status: 201, durationMs: Date.now() - start })
      return res
    }

    // A partir daqui, é upload de arquivo — `file` está garantidamente presente
    const uploadedFile = file as File
    const maxSizeBytes = isVideoTipo ? MAX_VIDEO_SIZE_BYTES : MAX_FILE_SIZE_BYTES
    const maxSizeMb = isVideoTipo ? MAX_VIDEO_SIZE_MB : MAX_FILE_SIZE_MB
    const allowedMimes: readonly string[] = isVideoTipo ? ALLOWED_VIDEO_MIMES : ALLOWED_MIMES
    const mimeLabel = isVideoTipo ? VIDEO_MIME_LABEL : MIME_LABEL

    // Inferir/normalizar MIME type quando o navegador enviar genérico ou não preenchido
    let mimeType = uploadedFile.type
    if (!mimeType || mimeType === 'application/octet-stream' || mimeType === 'application/x-pdf') {
      const ext = uploadedFile.name.split('.').pop()?.toLowerCase()
      if (ext === 'pdf') mimeType = 'application/pdf'
      else if (ext === 'png') mimeType = 'image/png'
      else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg'
      else if (ext === 'mp4') mimeType = 'video/mp4'
      else if (ext === 'webm') mimeType = 'video/webm'
      else if (ext === 'mov') mimeType = 'video/quicktime'
    }

    // Validar tamanho
    if (uploadedFile.size > maxSizeBytes) {
      const res = NextResponse.json(
        { error: 'BAD_REQUEST', message: `Arquivo excede o limite de ${maxSizeMb}MB.`, requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // Validar MIME type
    if (!allowedMimes.includes(mimeType)) {
      const res = NextResponse.json(
        { error: 'BAD_REQUEST', message: `Tipo de arquivo não permitido. Aceitos: ${mimeLabel}.`, requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // Validar magic bytes
    const buffer = Buffer.from(await uploadedFile.arrayBuffer())
    if (!validateMagicBytes(buffer, mimeType)) {
      const res = NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Conteúdo do arquivo não corresponde ao tipo declarado.', requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // Upload para Supabase com timestamp no path pra evitar colisão
    const safeName = sanitizeFilename(uploadedFile.name)
    const storagePath = `inscricoes/${id}/${Date.now()}_${safeName}`
    const url = await uploadFile('propostas', storagePath, buffer, mimeType)

    // Criar registro no banco — com rollback do arquivo se falhar
    let anexo: { id: string; url: string; titulo: string; tipo: string; createdAt: Date }
    try {
      anexo = await prisma.anexoInscricao.create({
        data: {
          inscricaoId: id,
          tipo,
          titulo,
          url,
        },
        select: { id: true, url: true, titulo: true, tipo: true, createdAt: true },
      })
    } catch (dbError) {
      // Rollback: remover arquivo órfão do storage
      try {
        await deleteFile('propostas', storagePath)
      } catch {
        console.error({ requestId, message: 'Falha ao remover arquivo órfão do storage', storagePath })
      }
      throw dbError
    }

    await logAudit({
      userId: session.user.id,
      action: 'ANEXO_ENVIADO',
      entity: 'AnexoInscricao',
      entityId: anexo.id,
      details: { inscricaoId: id, tipo, filename: safeName },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const res = NextResponse.json(
      { data: anexo, requestId },
      { status: 201 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({ requestId, method: 'POST', path: `/api/proponente/inscricoes/${id}/anexos`, status: 201, durationMs: Date.now() - start })
    return res
  } catch (err) {
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    const res = NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro interno. Tente novamente.', requestId },
      { status: 500 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  }
}

// ─── DELETE — Remover anexo ─────────────────────────────────────────────────

const deleteSchema = z.object({
  anexoId: z.string().min(1, 'anexoId é obrigatório'),
})

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const requestId = randomUUID()
  const start = Date.now()
  const { id } = await params

  try {
    const session = await auth()
    if (!session || session.user.role !== 'PROPONENTE') {
      const res = NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Acesso negado.', requestId },
        { status: 401 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const body = await req.json()
    const data = deleteSchema.parse(body)

    const anexo = await prisma.anexoInscricao.findUnique({
      where: { id: data.anexoId },
      include: {
        inscricao: {
          select: { id: true, proponenteId: true, status: true },
        },
      },
    })

    if (!anexo || anexo.inscricao.id !== id) {
      const res = NextResponse.json(
        { error: 'NOT_FOUND', message: 'Anexo não encontrado.', requestId },
        { status: 404 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    if (anexo.inscricao.proponenteId !== session.user.id) {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso negado.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    if (anexo.inscricao.status !== 'RASCUNHO') {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'Apenas rascunhos podem ter anexos removidos.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // Extrair path do Supabase a partir da URL
    const urlObj = new URL(anexo.url)
    const storagePath = urlObj.pathname.split('/propostas/').pop()
    if (storagePath) {
      try {
        await deleteFile('propostas', storagePath)
      } catch {
        // Continua mesmo se falhar a remoção do storage
        console.error({ requestId, message: 'Falha ao remover arquivo do storage', storagePath })
      }
    }

    await prisma.anexoInscricao.delete({ where: { id: data.anexoId } })

    const res = NextResponse.json({ message: 'Anexo removido.', requestId })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({ requestId, method: 'DELETE', path: `/api/proponente/inscricoes/${id}/anexos`, status: 200, durationMs: Date.now() - start })
    return res
  } catch (err) {
    if (err instanceof z.ZodError) {
      const res = NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Dados inválidos.', requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    const res = NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro interno. Tente novamente.', requestId },
      { status: 500 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  }
}
