import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { AUDIT_ACTIONS, logAudit } from '@/lib/audit'
import { deleteFile, uploadFile } from '@/lib/storage'

export const runtime = 'nodejs'

const MAX_BYTES = 2 * 1024 * 1024 // 2 MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])
const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}
const BUCKET = 'manuais'

// Extrai o path dentro do bucket a partir da URL pública salva no campo.
// Public URL do Supabase tem o formato:
//   https://<proj>.supabase.co/storage/v1/object/public/<bucket>/<path>
function extractAvatarPath(url: string | null | undefined): string | null {
  if (!url) return null
  const m = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/)
  return m ? m[1] : null
}

// POST — Upload de novo avatar. Substitui o existente (apaga o antigo).
export async function POST(req: NextRequest) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const session = await auth()
    if (!session) {
      const res = NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Faça login.', requestId },
        { status: 401 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const form = await req.formData()
    const file = form.get('file')
    if (!(file instanceof Blob)) {
      const res = NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Arquivo não enviado.', requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    if (file.size > MAX_BYTES) {
      const res = NextResponse.json(
        {
          error: 'FILE_TOO_LARGE',
          message: `Imagem maior que 2 MB. Atual: ${(file.size / 1024 / 1024).toFixed(1)} MB.`,
          requestId,
        },
        { status: 413 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }
    if (!ALLOWED_MIME.has(file.type)) {
      const res = NextResponse.json(
        {
          error: 'INVALID_TYPE',
          message: 'Formato não suportado. Use JPG, PNG ou WEBP.',
          requestId,
        },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // Apaga o avatar atual (se existir) antes de subir o novo.
    const current = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatarUrl: true },
    })
    const oldPath = extractAvatarPath(current?.avatarUrl)
    if (oldPath) {
      await deleteFile(BUCKET, oldPath).catch((err) => {
        console.warn('[avatar] falha ao remover antigo:', err)
      })
    }

    const ext = EXT_BY_MIME[file.type]
    const path = `avatars/${session.user.id}-${Date.now()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    const url = await uploadFile(BUCKET, path, buffer, file.type)

    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarUrl: url },
    })

    await logAudit({
      userId: session.user.id,
      action: AUDIT_ACTIONS.PERFIL_ATUALIZADO,
      entity: 'User',
      entityId: session.user.id,
      details: { field: 'avatarUrl' },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    console.log({
      requestId,
      method: 'POST',
      path: '/api/proponente/avatar',
      status: 200,
      durationMs: Date.now() - start,
    })

    const res = NextResponse.json({
      message: 'Avatar atualizado.',
      data: { avatarUrl: url },
      requestId,
    })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (err) {
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    const res = NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro interno.', requestId },
      { status: 500 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  }
}

// DELETE — Remove o avatar atual.
export async function DELETE(req: NextRequest) {
  const requestId = randomUUID()

  try {
    const session = await auth()
    if (!session) {
      const res = NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Faça login.', requestId },
        { status: 401 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const current = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatarUrl: true },
    })
    const path = extractAvatarPath(current?.avatarUrl)
    if (path) {
      await deleteFile(BUCKET, path).catch((err) => {
        console.warn('[avatar] falha ao remover:', err)
      })
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarUrl: null },
    })

    await logAudit({
      userId: session.user.id,
      action: AUDIT_ACTIONS.PERFIL_ATUALIZADO,
      entity: 'User',
      entityId: session.user.id,
      details: { field: 'avatarUrl', removed: true },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const res = NextResponse.json({ message: 'Avatar removido.', requestId })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (err) {
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    const res = NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro interno.', requestId },
      { status: 500 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  }
}
