import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * GET — Lista templates de formulário (ADMIN only).
 */
export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  const templates = await prisma.formTemplate.findMany({
    orderBy: { nome: 'asc' },
  })

  return NextResponse.json(templates)
}

/**
 * POST — Cria novo template de formulário (ADMIN only).
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  const body = await req.json()
  const nome = typeof body.nome === 'string' ? body.nome.trim() : ''
  const descricao = typeof body.descricao === 'string' ? body.descricao.trim() : null
  const camposFormulario = Array.isArray(body.camposFormulario) ? body.camposFormulario : []

  if (!nome) {
    return NextResponse.json({ error: 'Nome é obrigatório.' }, { status: 400 })
  }

  const exists = await prisma.formTemplate.findUnique({ where: { nome } })
  if (exists) {
    return NextResponse.json({ error: 'Template com este nome já existe.' }, { status: 409 })
  }

  const template = await prisma.formTemplate.create({
    data: { nome, descricao, camposFormulario },
  })

  return NextResponse.json(template, { status: 201 })
}
