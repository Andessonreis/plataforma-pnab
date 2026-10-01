import { NextRequest, NextResponse } from 'next/server'
import { isEditalFestival } from '@/lib/edital/dados-habilitados-festival'
import { gerarPdfHabilitadosFestival } from '@/lib/pdf/habilitados-festival'

export const runtime = 'nodejs'

interface RouteContext {
  params: Promise<{ slug: string }>
}

export async function GET(_req: NextRequest, context: RouteContext) {
  const { slug } = await context.params

  if (!isEditalFestival(slug)) {
    return NextResponse.json({ error: 'NOT_FOUND', message: 'PDF de habilitação não configurado para este edital.' }, { status: 404 })
  }

  try {
    const pdfBuffer = await gerarPdfHabilitadosFestival()

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="relacao-de-habilitados_festival-arte-cultura-irece-centenario-2026_2026-10-01.pdf"',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('Erro ao gerar PDF de habilitados:', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR', message: 'Erro ao gerar o PDF de habilitação.' }, { status: 500 })
  }
}
