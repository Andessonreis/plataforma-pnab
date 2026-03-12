import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * PUT — Atualiza uma categoria (ADMIN only).
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
  const nome = typeof body.nome === 'string' ? body.nome.trim() : undefined
  const ativo = typeof body.ativo === 'boolean' ? body.ativo : undefined
  const ordem = typeof body.ordem === 'number' ? body.ordem : undefined

  if (nome !== undefined && !nome) {
    return NextResponse.json({ error: 'Nome não pode ser vazio.' }, { status: 400 })
  }

  // Verifica duplicata de nome
  if (nome) {
    const dup = await prisma.categoria.findFirst({
      where: { nome, NOT: { id } },
    })
    if (dup) {
      return NextResponse.json({ error: 'Outra categoria com este nome já existe.' }, { status: 409 })
    }
  }

  try {
    const categoria = await prisma.categoria.update({
      where: { id },
      data: {
        ...(nome !== undefined && { nome }),
        ...(ativo !== undefined && { ativo }),
        ...(ordem !== undefined && { ordem }),
      },
    })
    return NextResponse.json(categoria)
  } catch {
    return NextResponse.json({ error: 'Categoria não encontrada.' }, { status: 404 })
  }
}

/**
 * DELETE — Remove uma categoria (ADMIN only).
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
    await prisma.categoria.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Categoria não encontrada.' }, { status: 404 })
  }
}
