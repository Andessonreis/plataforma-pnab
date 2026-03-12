import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { TipoDocumentoEscopo } from '@prisma/client'

const ESCOPOS_VALIDOS = ['EDITAL', 'INSCRICAO'] as const

/**
 * GET — Lista tipos de documento. Filtra por ?escopo=EDITAL|INSCRICAO.
 */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  const escopo = req.nextUrl.searchParams.get('escopo') as TipoDocumentoEscopo | null
  const showAll = req.nextUrl.searchParams.get('all') === '1' && session.user.role === 'ADMIN'

  const where: Record<string, unknown> = {}
  if (escopo && ESCOPOS_VALIDOS.includes(escopo as typeof ESCOPOS_VALIDOS[number])) {
    where.escopo = escopo
  }
  if (!showAll) {
    where.ativo = true
  }

  const tipos = await prisma.tipoDocumento.findMany({
    where,
    orderBy: [{ escopo: 'asc' }, { ordem: 'asc' }, { label: 'asc' }],
  })

  return NextResponse.json(tipos)
}

/**
 * POST — Cria novo tipo de documento (ADMIN only).
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  const body = await req.json()
  const valor = typeof body.valor === 'string' ? body.valor.trim().toUpperCase() : ''
  const label = typeof body.label === 'string' ? body.label.trim() : ''
  const escopo = body.escopo as TipoDocumentoEscopo

  if (!valor || !label) {
    return NextResponse.json({ error: 'Valor e label são obrigatórios.' }, { status: 400 })
  }
  if (!ESCOPOS_VALIDOS.includes(escopo as typeof ESCOPOS_VALIDOS[number])) {
    return NextResponse.json({ error: 'Escopo inválido.' }, { status: 400 })
  }

  const exists = await prisma.tipoDocumento.findUnique({
    where: { valor_escopo: { valor, escopo } },
  })
  if (exists) {
    return NextResponse.json({ error: 'Tipo já existe para este escopo.' }, { status: 409 })
  }

  const tipo = await prisma.tipoDocumento.create({
    data: { valor, label, escopo, ordem: typeof body.ordem === 'number' ? body.ordem : 0 },
  })

  return NextResponse.json(tipo, { status: 201 })
}
