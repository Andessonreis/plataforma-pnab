import { createReadStream, promises as fs } from 'node:fs'
import { Readable } from 'node:stream'
import { NextRequest, NextResponse } from 'next/server'
import { BUCKETS, isBucket } from '@/lib/storage/buckets'
import { assinaturaValida } from '@/lib/storage/assinatura'
import { contentTypePorExtensao } from '@/lib/storage/content-type'
import { resolverCaminho } from '@/lib/storage/paths'

export const runtime = 'nodejs'

type Params = { params: Promise<{ caminho: string[] }> }

function naoEncontrado(): NextResponse {
  return NextResponse.json({ error: 'NOT_FOUND', message: 'Arquivo não encontrado' }, { status: 404 })
}

/**
 * Serve arquivos do disco. Buckets públicos abrem direto; os privados exigem
 * `exp` e `sig` válidos (gerados por getSignedUrl).
 */
export async function GET(req: NextRequest, { params }: Params) {
  const [bucket, ...resto] = (await params).caminho.map(decodeURIComponent)
  if (!isBucket(bucket) || resto.length === 0) return naoEncontrado()
  const caminho = resto.join('/')

  const publico = BUCKETS[bucket].publico
  if (!publico) {
    const { searchParams } = new URL(req.url)
    const valida = assinaturaValida(
      bucket,
      caminho,
      Number(searchParams.get('exp')),
      searchParams.get('sig') ?? '',
    )
    if (!valida) {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Link expirado ou inválido' }, { status: 403 })
    }
  }

  let absoluto: string
  try {
    absoluto = resolverCaminho(bucket, caminho)
    if (!(await fs.stat(absoluto)).isFile()) return naoEncontrado()
  } catch {
    return naoEncontrado()
  }

  const { size } = await fs.stat(absoluto)
  const corpo = Readable.toWeb(createReadStream(absoluto)) as ReadableStream
  return new NextResponse(corpo, {
    headers: {
      'Content-Type': contentTypePorExtensao(absoluto),
      'Content-Length': String(size),
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': publico ? 'public, max-age=3600, stale-while-revalidate=86400' : 'private, no-store',
    },
  })
}
