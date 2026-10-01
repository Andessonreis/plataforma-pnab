import fs from 'fs'
import path from 'path'
import { gerarPdfHabilitadosFestival } from '../src/lib/pdf/habilitados-festival'

export { gerarPdfHabilitadosFestival }

async function main() {
  console.log('Gerando PDF da Relação de Habilitados...')
  const buffer = await gerarPdfHabilitadosFestival()

  const docDir = '/home/andesson-reis/Documents'
  if (fs.existsSync(docDir)) {
    const outPdfDocuments = path.join(docDir, 'relacao-de-habilitados_festival-arte-cultura-irece-centenario-2026_2026-10-01.pdf')
    fs.writeFileSync(outPdfDocuments, buffer)
    console.log(`PDF salvo com sucesso em: ${outPdfDocuments} (${buffer.length} bytes)`)
  }

  const artifactsDir = path.resolve('.omc/artifacts')
  if (fs.existsSync(artifactsDir)) {
    const outPdfArtifacts = path.join(artifactsDir, 'relacao-de-habilitados_festival-arte-cultura-irece-centenario-2026_2026-10-01.pdf')
    fs.writeFileSync(outPdfArtifacts, buffer)
    console.log(`Cópia salva em: ${outPdfArtifacts}`)
  }

  const publicDocDir = path.resolve('public/documentos')
  if (!fs.existsSync(publicDocDir)) {
    fs.mkdirSync(publicDocDir, { recursive: true })
  }
  const outPublic = path.join(publicDocDir, 'relacao-de-habilitados_festival-arte-cultura-irece-centenario-2026_2026-10-01.pdf')
  fs.writeFileSync(outPublic, buffer)
  console.log(`Cópia salva em public/documentos: ${outPublic}`)
}

if (process.argv[1]?.endsWith('gerar-pdf-habilitados-festival.ts')) {
  main().catch(console.error)
}
