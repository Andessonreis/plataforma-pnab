import { describe, it, expect } from 'vitest'
import { resolverTemplateResultado, TEMPLATE_RESULTADO_PADRAO } from '../template-resultado'

describe('resolverTemplateResultado', () => {
  it.each([null, undefined, {}, 'texto', 3, [], true])('sem configuração utilizável (%j) vale o padrão', (bruto) => {
    expect(resolverTemplateResultado(bruto)).toEqual(TEMPLATE_RESULTADO_PADRAO)
  })

  it('o padrão reproduz o layout publicado no Festival', () => {
    expect(TEMPLATE_RESULTADO_PADRAO).toEqual({
      fotos: ['/images/galeria/foto-03.png', '/images/cidade/panoramica-irece.jpg'],
      titulos: { preliminar: 'Resultado preliminar', definitivo: 'Resultado final' },
      rotulos: {
        classificado: 'Classificado', desclassificado: 'Desclassificado', suplente: 'Suplente',
        emRecurso: 'Em recurso', naoSeAplica: 'Não se aplica',
      },
      foraDaClassificacao: [],
    })
  })

  it('o que a configuração traz vale, e o que ela não traz continua no padrão', () => {
    const template = resolverTemplateResultado({
      titulos: { definitivo: 'Classificação final' },
      rotulos: { classificado: 'Contemplado' },
      foraDaClassificacao: ['PNAB-2026-0046'],
    })

    expect(template.titulos).toEqual({ preliminar: 'Resultado preliminar', definitivo: 'Classificação final' })
    expect(template.rotulos).toMatchObject({ classificado: 'Contemplado', suplente: 'Suplente', naoSeAplica: 'Não se aplica' })
    expect(template.foraDaClassificacao).toEqual(['PNAB-2026-0046'])
    expect(template.fotos).toEqual(TEMPLATE_RESULTADO_PADRAO.fotos)
  })

  it('aceita fotos do próprio portal, de uma a quatro', () => {
    expect(resolverTemplateResultado({ fotos: ['/images/outra.jpg'] }).fotos).toEqual(['/images/outra.jpg'])
    expect(resolverTemplateResultado({ fotos: ['/a.png', '/b.webp', '/c.jpeg', '/d.avif'] }).fotos).toHaveLength(4)
  })

  it.each([
    [[]],
    [['/a.png', '/b.png', '/c.png', '/d.png', '/e.png']],
    [['https://outro.site/foto.jpg']],
    [['//outro.site/foto.jpg']],
    [['/images/../segredo.png']],
    [['/images/arquivo.svg']],
    ['/images/foto.png'],
  ])('foto inválida (%j) volta ao padrão, sem abrir outro endereço', (fotos) => {
    expect(resolverTemplateResultado({ fotos }).fotos).toEqual(TEMPLATE_RESULTADO_PADRAO.fotos)
  })

  it('campo inválido volta ao padrão sem desfazer os campos certos', () => {
    const template = resolverTemplateResultado({
      titulos: { preliminar: '   ', definitivo: 42 },
      rotulos: { classificado: 'Contemplado', suplente: 'x'.repeat(200) },
      foraDaClassificacao: ['PNAB-2026-0046'],
    })

    expect(template.titulos).toEqual(TEMPLATE_RESULTADO_PADRAO.titulos)
    expect(template.rotulos.classificado).toBe('Contemplado')
    expect(template.rotulos.suplente).toBe('Suplente')
    expect(template.foraDaClassificacao).toEqual(['PNAB-2026-0046'])
  })

  it('uma entrada malformada na lista de exceções é descartada sem apagar as outras', () => {
    const template = resolverTemplateResultado({
      foraDaClassificacao: ['PNAB-2026-0046', 7, null, '  ', ' PNAB-2026-0099 ', { numero: 'x' }],
    })

    expect(template.foraDaClassificacao).toEqual(['PNAB-2026-0046', 'PNAB-2026-0099'])
  })

  it('lista de exceções que não é lista vira vazia', () => {
    expect(resolverTemplateResultado({ foraDaClassificacao: 'PNAB-2026-0046' }).foraDaClassificacao).toEqual([])
  })

  it('ignora campos que o template não conhece', () => {
    expect(resolverTemplateResultado({ qualquerCoisa: 1, fotos: ['/images/x.png'] })).not.toHaveProperty('qualquerCoisa')
  })
})
