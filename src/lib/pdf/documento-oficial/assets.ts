import fs from 'fs'
import path from 'path'
import QRCode from 'qrcode'
import { CORES } from './tema'

/**
 * Marcas institucionais e QR de verificação.
 *
 * A régua é o lockup oficial do município — Prefeitura, centenário e o nome da
 * Secretaria numa peça só, a mesma que abre as matérias do Diário Oficial. Vem
 * do PDF vetorial rasterizado a 600dpi, porque a versão de 777px que existia
 * saía borrada em qualquer largura útil de página.
 */
export const MARCAS = {
  regua: 'public/images/marca/regua-100-anos.png',
  pnab: 'public/images/marca/selo-pnab.png',
  cidades: 'public/images/marca/logo-cidades-inteligentes-color.png',
  /** Brasão e logo da Secretaria: timbre da versão 1, que não usa a régua. */
  brasao: 'public/images/marca/brasao-irece.png',
  secult: 'public/images/secult/logo-secult-horizontal.png',
} as const

/** Proporção altura/largura de cada marca, para posicionar sem medir o arquivo. */
export const PROPORCAO = {
  regua: 677 / 4385,
  pnab: 294 / 612,
  cidades: 185 / 649,
  brasao: 97 / 85,
  secult: 597 / 1207,
} as const

const cache = new Map<string, Buffer | null>()

/** Lê a marca do disco uma vez por processo. Documento sem marca sai mesmo assim. */
export function carregarMarca(relativo: string): Buffer | null {
  if (!cache.has(relativo)) {
    try {
      cache.set(relativo, fs.readFileSync(path.join(process.cwd(), relativo)))
    } catch {
      cache.set(relativo, null)
    }
  }
  return cache.get(relativo) ?? null
}

/** QR em PNG, gerado uma vez por documento e reaproveitado em cada página. */
export async function gerarQrCode(url: string, tamanho: number): Promise<Buffer | null> {
  try {
    return await QRCode.toBuffer(url, {
      type: 'png',
      errorCorrectionLevel: 'M',
      margin: 0,
      width: tamanho * 4, // 4x para não serrilhar na impressão
      color: { dark: CORES.tinta, light: CORES.papel },
    })
  } catch {
    return null
  }
}
