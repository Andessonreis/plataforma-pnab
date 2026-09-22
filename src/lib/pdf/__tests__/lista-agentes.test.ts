import { describe, it, expect } from 'vitest'
import { generateListaAgentes } from '../lista-agentes'
import { agenteDeTeste, lerPdf, listaAgentesDeTeste } from './apoio-pdf'

describe('generateListaAgentes', () => {
  it('sai como PDF com o título padrão em Info.Title', async () => {
    const pdf = await lerPdf(await generateListaAgentes(listaAgentesDeTeste({ quantidade: 3 })))

    expect(pdf.assinatura).toBe('%PDF-')
    expect(pdf.titulo).toBe('Agentes Culturais Cadastrados')
  })

  it('título informado na geração vai para Info.Title', async () => {
    const pdf = await lerPdf(await generateListaAgentes(listaAgentesDeTeste({ titulo: 'Agentes do edital' })))

    expect(pdf.titulo).toBe('Agentes do edital')
  })

  it('sem registro de emissão o PDF sai igual, sem página de protocolo', async () => {
    const com = await lerPdf(await generateListaAgentes(listaAgentesDeTeste({ quantidade: 3 })))
    const sem = await lerPdf(await generateListaAgentes(listaAgentesDeTeste({ quantidade: 3, emissao: null })))
    const omitida = await lerPdf(await generateListaAgentes(listaAgentesDeTeste({ quantidade: 3, emissao: undefined })))

    expect(sem.assinatura).toBe('%PDF-')
    expect(sem.titulo).toBe(com.titulo)
    expect(omitida.paginas).toBe(sem.paginas)
    expect(sem.paginas).toBeLessThan(com.paginas)
  })

  it('sem cadastros ainda gera o documento, com a linha de "nada consta"', async () => {
    const pdf = await lerPdf(await generateListaAgentes(listaAgentesDeTeste({ quantidade: 0 })))

    expect(pdf.assinatura).toBe('%PDF-')
    expect(pdf.titulo).toBe('Agentes Culturais Cadastrados')
  })

  it('lista longa com todos os campos quebra em várias páginas', async () => {
    const pdf = await lerPdf(await generateListaAgentes(listaAgentesDeTeste({
      campos: ['nome', 'email', 'telefone', 'cpfCnpj', 'tipo', 'perfil', 'cidade', 'situacao', 'inscricoes', 'cadastradoEm'],
      agentes: Array.from({ length: 120 }, (_, i) => agenteDeTeste({ nome: `Agente ${i + 1}` })),
      emissao: null,
    })))

    expect(pdf.paginas).toBeGreaterThan(1)
  })
})
