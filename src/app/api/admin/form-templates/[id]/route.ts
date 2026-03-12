import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * PUT — Atualiza template (ADMIN only).
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
  const descricao = typeof body.descricao === 'string' ? body.descricao.trim() : undefined
  const camposFormulario = Array.isArray(body.camposFormulario) ? body.camposFormulario : undefined

  if (nome !== undefined && !nome) {
    return NextResponse.json({ error: 'Nome não pode ser vazio.' }, { status: 400 })
  }

  if (nome) {
    const dup = await prisma.formTemplate.findFirst({
      where: { nome, NOT: { id } },
    })
    if (dup) {
      return NextResponse.json({ error: 'Outro template com este nome já existe.' }, { status: 409 })
    }
  }

  try {
    const template = await prisma.formTemplate.update({
      where: { id },
      data: {
        ...(nome !== undefined && { nome }),
        ...(descricao !== undefined && { descricao }),
        ...(camposFormulario !== undefined && { camposFormulario }),
      },
    })
    return NextResponse.json(template)
  } catch {
    return NextResponse.json({ error: 'Template não encontrado.' }, { status: 404 })
  }
}

/**
 * DELETE — Remove template (ADMIN only).
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
    await prisma.formTemplate.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Template não encontrado.' }, { status: 404 })
  }
}
