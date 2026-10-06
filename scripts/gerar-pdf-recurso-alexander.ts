import fs from 'fs'
import path from 'path'
import { gerarPdfRecursoAlexander } from '../src/lib/pdf/recurso-alexander'

export { gerarPdfRecursoAlexander }

async function main() {
  console.log('Gerando PDF do Recurso Digitalizado de Alexander Gondim Barretto...')
  const buffer = await gerarPdfRecursoAlexander()

  const docDir = '/home/andesson-reis/Documents'
  if (fs.existsSync(docDir)) {
    const outPdfDocuments = path.join(docDir, 'recurso-habilitacao_PNAB-2026-0024_alexander-gondim-barretto.pdf')
    fs.writeFileSync(outPdfDocuments, buffer)
    console.log(`PDF salvo com sucesso em: ${outPdfDocuments} (${buffer.length} bytes)`)
  }

  const artifactsDir = path.resolve('.omc/artifacts')
  if (fs.existsSync(artifactsDir)) {
    const outPdfArtifacts = path.join(artifactsDir, 'recurso-habilitacao_PNAB-2026-0024_alexander-gondim-barretto.pdf')
    fs.writeFileSync(outPdfArtifacts, buffer)
    console.log(`Cópia salva em: ${outPdfArtifacts}`)
  }

  const publicDocDir = path.resolve('public/documentos')
  if (!fs.existsSync(publicDocDir)) {
    fs.mkdirSync(publicDocDir, { recursive: true })
  }
  const outPublic = path.join(publicDocDir, 'recurso-habilitacao_PNAB-2026-0024_alexander-gondim-barretto.pdf')
  fs.writeFileSync(outPublic, buffer)
  console.log(`Cópia salva em public/documentos: ${outPublic}`)
}

if (process.argv[1]?.endsWith('gerar-pdf-recurso-alexander.ts')) {
  main().catch(console.error)
}
