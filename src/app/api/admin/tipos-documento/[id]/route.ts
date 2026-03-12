import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * PUT — Atualiza um tipo de documento (ADMIN only).
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const label = typeof body.label === 'string' ? body.label.trim() : undefined
  const ativo = typeof body.ativo === 'boolean' ? body.ativo : undefined
  const ordem = typeof body.ordem === 'number' ? body.ordem : undefined

  if (label !== undefined && !label) {
    return NextResponse.json({ error: 'Label não pode ser vazio.' }, { status: 400 })
  }

  try {
    const tipo = await prisma.tipoDocumento.update({
      where: { id },
      data: {
        ...(label !== undefined && { label }),
        ...(ativo !== undefined && { ativo }),
        ...(ordem !== undefined && { ordem }),
      },
    })
    return NextResponse.json(tipo)
  } catch {
    return NextResponse.json({ error: 'Tipo não encontrado.' }, { status: 404 })
  }
}

/**
 * DELETE — Remove um tipo de documento (ADMIN only).
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  const { id } = await params

  try {
    await prisma.tipoDocumento.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Tipo não encontrado.' }, { status: 404 })
  }
}
