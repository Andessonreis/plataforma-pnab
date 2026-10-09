import fs from 'fs'
import path from 'path'
import { gerarPdfConvocacaoSuplente } from '../src/lib/pdf/convocacao-suplente'

export { gerarPdfConvocacaoSuplente }

async function main() {
  console.log('Gerando PDF da Convocação de Suplente — CULTURA POPULAR...')
  const buffer = await gerarPdfConvocacaoSuplente()

  const filenames = [
    'convocacao-de-suplente_festival-arte-cultura-irece-centenario-2026_2026-10-08.pdf',
    'convocacao-de-suplente_cultura-popular_2026-10-08.pdf',
    'convocacao-de-suplente.pdf',
  ]

  const destinations = [
    '/home/andesson-reis/Documents',
    '/home/andesson-reis/Downloads',
    path.resolve('.omc/artifacts'),
    path.resolve('public/documentos'),
  ]

  for (const dir of destinations) {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true })
      } catch {
        // ignora se não tiver permissão
      }
    }

    if (fs.existsSync(dir)) {
      for (const fname of filenames) {
        const outPath = path.join(dir, fname)
        fs.writeFileSync(outPath, buffer)
        console.log(`Salvo em: ${outPath} (${buffer.length} bytes)`)
      }
    }
  }
}

if (process.argv[1]?.endsWith('gerar-pdf-convocacao-suplente.ts')) {
  main().catch(console.error)
}
