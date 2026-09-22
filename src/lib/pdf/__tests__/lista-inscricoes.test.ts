import { describe, it, expect } from 'vitest'
import { generateListaInscricoes } from '../lista-inscricoes'
import { itemDeLista, lerPdf, listaInscricoesDeTeste } from './apoio-pdf'

describe('generateListaInscricoes', () => {
  it.each([
    ['HABILITADA', 'Habilitada', 'Relação Definitiva de Habilitados'],
    ['ENVIADA', 'Enviada', 'Relação de Inscritos'],
    ['RASCUNHO', 'Rascunho', 'Relação de Inscrições em Rascunho'],
    ['INABILITADA', 'Inabilitada', 'Relação de Inscrições — Inabilitada'],
    ['CONTEMPLADA', 'Contemplada', 'Relação de Inscrições — Contemplada'],
  ])('lista %s sai como PDF e grava o título padrão em Info.Title', async (status, statusLabel, esperado) => {
    const pdf = await lerPdf(await generateListaInscricoes(
      listaInscricoesDeTeste({ quantidade: 3, status, statusLabel }),
    ))

    expect(pdf.assinatura).toBe('%PDF-')
    expect(pdf.titulo).toBe(esperado)
  })

  it('título fixado na geração vence o padrão do status', async () => {
    const pdf = await lerPdf(await generateListaInscricoes(listaInscricoesDeTeste({
      status: 'HABILITADA', statusLabel: 'Habilitada', tituloDocumento: 'Relação preliminar',
    })))

    expect(pdf.titulo).toBe('Relação preliminar')
  })

  it('sem registro de emissão o PDF sai igual, sem página de protocolo', async () => {
    const com = await lerPdf(await generateListaInscricoes(listaInscricoesDeTeste({ quantidade: 3 })))
    const sem = await lerPdf(await generateListaInscricoes(listaInscricoesDeTeste({ quantidade: 3, emissao: null })))
    const omitida = await lerPdf(await generateListaInscricoes(listaInscricoesDeTeste({ quantidade: 3, emissao: undefined })))

    expect(sem.assinatura).toBe('%PDF-')
    expect(sem.titulo).toBe(com.titulo)
    expect(omitida.paginas).toBe(sem.paginas)
    expect(sem.paginas).toBeLessThan(com.paginas)
  })

  it('lista vazia ainda gera o documento com o título do status', async () => {
    const pdf = await lerPdf(await generateListaInscricoes(listaInscricoesDeTeste({ quantidade: 0 })))

    expect(pdf.assinatura).toBe('%PDF-')
    expect(pdf.titulo).toBe('Relação de Inscritos')
  })

  it('lista longa quebra em várias páginas', async () => {
    const pdf = await lerPdf(await generateListaInscricoes(
      listaInscricoesDeTeste({ quantidade: 60, emissao: null }),
    ))

    expect(pdf.paginas).toBeGreaterThan(1)
  })

  it('recortes agrupado e por área mantêm o título do status', async () => {
    const agrupada = await lerPdf(await generateListaInscricoes(listaInscricoesDeTeste({
      agruparPorCategoria: true,
      inscricoes: [itemDeLista(1), itemDeLista(2, { categoria: 'Teatro' }), itemDeLista(3, { categoria: null })],
    })))
    const porArea = await lerPdf(await generateListaInscricoes(
      listaInscricoesDeTeste({ quantidade: 3, categoria: 'Música' }),
    ))

    expect(agrupada.titulo).toBe('Relação de Inscritos')
    expect(porArea.titulo).toBe('Relação de Inscritos')
  })

  it('lista com nota e com telefone gera PDF válido', async () => {
    const contemplada = await lerPdf(await generateListaInscricoes(
      listaInscricoesDeTeste({ quantidade: 3, status: 'CONTEMPLADA', statusLabel: 'Contemplada' }),
    ))
    const rascunho = await lerPdf(await generateListaInscricoes(listaInscricoesDeTeste({
      status: 'RASCUNHO', statusLabel: 'Rascunho', inscricoes: [itemDeLista(1, { telefone: null })],
    })))

    expect(contemplada.assinatura).toBe('%PDF-')
    expect(rascunho.assinatura).toBe('%PDF-')
  })
})
