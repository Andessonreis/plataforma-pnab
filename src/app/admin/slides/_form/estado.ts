import type { SlideDestaque as SlideRegistro } from '@prisma/client'
import { pecaSchema, VARAL_QUANTIDADE, type FormatoSlide } from '@/lib/schemas/slide-destaque'
import type { SlideDestaque } from '@/components/home/types'

/*
 * Estado do formulário de slide e as conversões em volta dele: registro do
 * banco → formulário, formulário → corpo da API e formulário → slide da home
 * (pré-visualização). Tudo puro, para ser testado sem montar a tela.
 *
 * O formulário guarda só strings (é o que os inputs devolvem); a validação e
 * a conversão de tipos ficam com `slideSchema`, a mesma regra da API.
 */

export interface FormPeca {
  chamada: string
  chamadaDestaque: string
  autoria: string
  apoioDestaque: string
  ctaSecundarioLabel: string
  ctaSecundarioUrl: string
  destaqueUrl: string
  destaqueAlt: string
  destaqueLegenda: string
  /** Sempre três posições; as vazias são descartadas ao salvar. */
  linhas: [string, string, string]
  temVaral: boolean
  varalRotulo: string
  varalQuantidade: string
  varalAnoInicial: string
  varalAnoFinal: string
}

export interface FormSlide {
  formato: FormatoSlide
  titulo: string
  descricao: string
  imagemUrl: string
  ctaLabel: string
  ctaUrl: string
  ordem: number
  ativo: boolean
  inicioEm: string
  fimEm: string
  peca: FormPeca
}

const PECA_VAZIA: FormPeca = {
  chamada: '',
  chamadaDestaque: '',
  autoria: '',
  apoioDestaque: '',
  ctaSecundarioLabel: '',
  ctaSecundarioUrl: '',
  destaqueUrl: '',
  destaqueAlt: '',
  destaqueLegenda: '',
  linhas: ['', '', ''],
  temVaral: false,
  varalRotulo: '',
  varalQuantidade: '28',
  varalAnoInicial: '',
  varalAnoFinal: '',
}

export function formVazio(): FormSlide {
  return {
    formato: 'ARTE',
    titulo: '',
    descricao: '',
    imagemUrl: '',
    ctaLabel: '',
    ctaUrl: '',
    ordem: 0,
    ativo: true,
    inicioEm: '',
    fimEm: '',
    peca: { ...PECA_VAZIA, linhas: ['', '', ''] },
  }
}

/** `datetime-local` aceita só "AAAA-MM-DDTHH:mm" — mesmo recorte que a tela já usava. */
const paraDataLocal = (data: Date | null) => (data ? data.toISOString().slice(0, 16) : '')

export function formDoRegistro(slide: SlideRegistro): FormSlide {
  const lida = pecaSchema.safeParse(slide.peca)
  const p = lida.success ? lida.data : null
  return {
    formato: slide.formato,
    titulo: slide.titulo,
    descricao: slide.descricao ?? '',
    imagemUrl: slide.imagemUrl ?? '',
    ctaLabel: slide.ctaLabel ?? '',
    ctaUrl: slide.ctaUrl ?? '',
    ordem: slide.ordem,
    ativo: slide.ativo,
    inicioEm: paraDataLocal(slide.inicioEm),
    fimEm: paraDataLocal(slide.fimEm),
    peca: !p
      ? { ...PECA_VAZIA, linhas: ['', '', ''] }
      : {
          chamada: p.chamada,
          chamadaDestaque: p.chamadaDestaque ?? '',
          autoria: p.autoria ?? '',
          apoioDestaque: p.apoioDestaque ?? '',
          ctaSecundarioLabel: p.ctaSecundario?.label ?? '',
          ctaSecundarioUrl: p.ctaSecundario?.url ?? '',
          destaqueUrl: p.destaque?.url ?? '',
          destaqueAlt: p.destaque?.alt ?? '',
          destaqueLegenda: p.destaque?.legenda ?? '',
          linhas: [p.linhas[0] ?? '', p.linhas[1] ?? '', p.linhas[2] ?? ''],
          temVaral: Boolean(p.varal),
          varalRotulo: p.varal?.rotulo ?? '',
          varalQuantidade: String(p.varal?.quantidade ?? 28),
          varalAnoInicial: p.varal ? String(p.varal.anoInicial) : '',
          varalAnoFinal: p.varal ? String(p.varal.anoFinal) : '',
        },
  }
}

function pecaDoForm(p: FormPeca) {
  return {
    chamada: p.chamada,
    chamadaDestaque: p.chamadaDestaque || null,
    autoria: p.autoria || null,
    apoioDestaque: p.apoioDestaque || null,
    ctaSecundario:
      p.ctaSecundarioLabel || p.ctaSecundarioUrl ? { label: p.ctaSecundarioLabel, url: p.ctaSecundarioUrl } : null,
    destaque: p.destaqueUrl ? { url: p.destaqueUrl, alt: p.destaqueAlt, legenda: p.destaqueLegenda || null } : null,
    linhas: p.linhas.map((l) => l.trim()).filter(Boolean),
    varal: p.temVaral
      ? {
          rotulo: p.varalRotulo,
          quantidade: p.varalQuantidade,
          anoInicial: p.varalAnoInicial,
          anoFinal: p.varalAnoFinal,
        }
      : null,
  }
}

/** Corpo enviado à API (e validado antes no navegador com o mesmo `slideSchema`). */
export function payloadDoForm(f: FormSlide) {
  return {
    formato: f.formato,
    titulo: f.titulo,
    descricao: f.descricao || null,
    imagemUrl: f.imagemUrl || null,
    ctaLabel: f.ctaLabel || null,
    ctaUrl: f.ctaUrl || null,
    ordem: f.ordem,
    ativo: f.ativo,
    inicioEm: f.inicioEm || null,
    fimEm: f.fimEm || null,
    peca: f.formato === 'PECA' ? pecaDoForm(f.peca) : null,
  }
}

/**
 * Slide como a home o desenharia, para a pré-visualização. Aceita formulário
 * incompleto: campo obrigatório vazio aparece como um texto-guia no lugar, para
 * a pessoa ver onde ele vai cair no quadro antes de preencher.
 */
export function previaDoForm(f: FormSlide): SlideDestaque {
  const base = { id: 'previa', titulo: f.titulo || 'Título do slide', subtitulo: f.descricao || undefined }
  const ctaLabel = f.ctaLabel || 'Botão principal'
  if (f.formato === 'ARTE') {
    return { ...base, tipo: 'arte', imagemUrl: f.imagemUrl, ctaLabel: f.ctaLabel || 'Saiba mais', ctaUrl: '#' }
  }

  const p = pecaDoForm(f.peca)
  const numero = (v: string | number, padrao: number) => Number(v) || padrao
  return {
    ...base,
    tipo: 'peca',
    ctaLabel,
    ctaUrl: '#',
    peca: {
      ...p,
      chamada: p.chamada || 'Chamada da peça',
      ctaSecundario: p.ctaSecundario && { label: p.ctaSecundario.label || 'Segundo botão', url: '#' },
      destaque: p.destaque && { ...p.destaque, alt: p.destaque.alt || 'Foto colada' },
      varal: p.varal && {
        rotulo: p.varal.rotulo || 'Texto da faixa de fotografias',
        quantidade: Math.min(VARAL_QUANTIDADE.max, Math.max(VARAL_QUANTIDADE.min, numero(p.varal.quantidade, 28))),
        anoInicial: numero(p.varal.anoInicial, 1950),
        anoFinal: Math.max(numero(p.varal.anoFinal, 1980), numero(p.varal.anoInicial, 1950) + 1),
      },
      apoio: f.descricao || null,
      fundo: f.imagemUrl,
    },
  }
}
