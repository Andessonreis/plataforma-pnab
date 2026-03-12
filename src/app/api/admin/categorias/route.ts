import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * GET — Lista categorias (ativas por padrão, ?all=1 para todas).
 */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  const showAll = req.nextUrl.searchParams.get('all') === '1'

  const categorias = await prisma.categoria.findMany({
    where: showAll && session.user.role === 'ADMIN' ? {} : { ativo: true },
    orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
  })

  return NextResponse.json(categorias)
}

/**
 * POST — Cria nova categoria (ADMIN only).
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  const body = await req.json()
  const nome = typeof body.nome === 'string' ? body.nome.trim() : ''
  const ordem = typeof body.ordem === 'number' ? body.ordem : 0

  if (!nome) {
    return NextResponse.json({ error: 'Nome é obrigatório.' }, { status: 400 })
  }

  const exists = await prisma.categoria.findUnique({ where: { nome } })
  if (exists) {
    return NextResponse.json({ error: 'Categoria já existe.' }, { status: 409 })
  }

  const categoria = await prisma.categoria.create({
    data: { nome, ordem },
  })

  return NextResponse.json(categoria, { status: 201 })
}
