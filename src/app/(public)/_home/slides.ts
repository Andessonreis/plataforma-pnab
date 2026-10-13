import type { SlideDestaque as SlideRegistro } from '@prisma/client'
import { prisma } from '@/lib/db'
import { pecaSchema } from '@/lib/schemas/slide-destaque'
import type { SlideDestaque } from '@/components/home/types'
import { SLIDE_INSTITUCIONAL } from './slide-institucional'

type CamposSlide = Pick<
  SlideRegistro,
  'id' | 'formato' | 'titulo' | 'descricao' | 'imagemUrl' | 'peca' | 'ctaLabel' | 'ctaUrl'
>

/**
 * Converte o registro do admin no slide da abertura, ou `null` quando ele não
 * se sustenta no quadro. Um slide quebrado some da home em vez de derrubá-la:
 * arte sem imagem, peça sem fundo/botão ou com JSON fora do contrato (gravado
 * à mão no banco, por exemplo) simplesmente não entram no rodízio.
 */
export function slideDoRegistro(registro: CamposSlide): SlideDestaque | null {
  const base = {
    id: `slide-${registro.id}`,
    titulo: registro.titulo,
    subtitulo: registro.descricao ?? undefined,
  }

  if (registro.formato === 'PECA') {
    const peca = pecaSchema.safeParse(registro.peca)
    if (!peca.success || !registro.imagemUrl || !registro.ctaLabel || !registro.ctaUrl) return null
    return {
      ...base,
      tipo: 'peca',
      ctaLabel: registro.ctaLabel,
      ctaUrl: registro.ctaUrl,
      peca: { ...peca.data, apoio: registro.descricao, fundo: registro.imagemUrl },
    }
  }

  if (!registro.imagemUrl) return null
  return {
    ...base,
    tipo: 'arte',
    imagemUrl: registro.imagemUrl,
    ctaLabel: registro.ctaLabel ?? 'Saiba mais',
    ctaUrl: registro.ctaUrl ?? '/editais',
  }
}

/**
 * Slides da abertura: o institucional dos editais (gerado no código, sempre o
 * primeiro) e os cadastrados no admin que estão ativos e dentro da janela de
 * exibição (`inicioEm`/`fimEm` nulos = sem limite).
 */
export async function buscarSlidesAbertura(agora: Date): Promise<SlideDestaque[]> {
  const registros = await prisma.slideDestaque.findMany({
    where: {
      ativo: true,
      AND: [
        { OR: [{ inicioEm: null }, { inicioEm: { lte: agora } }] },
        { OR: [{ fimEm: null }, { fimEm: { gte: agora } }] },
      ],
    },
    orderBy: [{ ordem: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      formato: true,
      titulo: true,
      descricao: true,
      imagemUrl: true,
      peca: true,
      ctaLabel: true,
      ctaUrl: true,
    },
  })

  const cadastrados = registros
    .map(slideDoRegistro)
    .filter((slide): slide is SlideDestaque => slide !== null)
  return [SLIDE_INSTITUCIONAL, ...cadastrados]
}
