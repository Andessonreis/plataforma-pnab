import { describe, it, expect, vi } from 'vitest'
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
    expect(resolverTemplateResultado({ fotos: ['/images/a.png', '/images/b.webp', '/images/c.jpeg', '/images/d.avif'] }).fotos)
      .toHaveLength(4)
  })

  it.each([
    [[]],
    [['/images/a.png', '/images/b.png', '/images/c.png', '/images/d.png', '/images/e.png']],
    [['/foto.png']],
    [['/api/admin/alguma-rota.png']],
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

  it('ignora campos que o template não conhece', () => {
    expect(resolverTemplateResultado({ qualquerCoisa: 1, fotos: ['/images/x.png'] })).not.toHaveProperty('qualquerCoisa')
  })

  it('o número da exceção é normalizado para caixa alta', () => {
    expect(resolverTemplateResultado({ foraDaClassificacao: [' pnab-2026-0046 '] }).foraDaClassificacao)
      .toEqual(['PNAB-2026-0046'])
  })

  it('a lista de exceções tem limite de tamanho, da lista e de cada número', () => {
    const muitas = Array.from({ length: 300 }, (_, i) => `PNAB-2026-${String(i).padStart(4, '0')}`)

    expect(resolverTemplateResultado({ foraDaClassificacao: muitas }).foraDaClassificacao).toHaveLength(200)
    expect(resolverTemplateResultado({ foraDaClassificacao: ['X'.repeat(33), 'PNAB-2026-0046'] }).foraDaClassificacao)
      .toEqual(['PNAB-2026-0046'])
  })

  it('lista de exceções que não é lista vira vazia e é registrada no log', () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {})

    expect(resolverTemplateResultado({ foraDaClassificacao: 'PNAB-2026-0046' }).foraDaClassificacao).toEqual([])
    expect(aviso).toHaveBeenCalledWith(expect.objectContaining({ campo: 'foraDaClassificacao' }))

    aviso.mockClear()
    resolverTemplateResultado({})
    resolverTemplateResultado({ foraDaClassificacao: null })
    expect(aviso).not.toHaveBeenCalled()
    aviso.mockRestore()
  })

  it('quem recebe o template pode alterá-lo sem mudar o padrão dos outros editais', () => {
    const primeiro = resolverTemplateResultado(null)
    primeiro.fotos.push('/images/intrusa.jpg')
    primeiro.foraDaClassificacao.push('PNAB-2026-0001')
    primeiro.rotulos.suplente = 'Alterado'

    const segundo = resolverTemplateResultado(undefined)
    expect(segundo).toEqual({
      fotos: ['/images/galeria/foto-03.png', '/images/cidade/panoramica-irece.jpg'],
      titulos: { preliminar: 'Resultado preliminar', definitivo: 'Resultado final' },
      rotulos: expect.objectContaining({ suplente: 'Suplente' }),
      foraDaClassificacao: [],
    })
    expect(TEMPLATE_RESULTADO_PADRAO.fotos).toHaveLength(2)
  })

  it('campo ausente também devolve cópia, não o objeto do padrão', () => {
    const template = resolverTemplateResultado({ foraDaClassificacao: ['PNAB-2026-0046'] })

    expect(template.fotos).not.toBe(TEMPLATE_RESULTADO_PADRAO.fotos)
    expect(template.titulos).not.toBe(TEMPLATE_RESULTADO_PADRAO.titulos)
    expect(template.rotulos).not.toBe(TEMPLATE_RESULTADO_PADRAO.rotulos)
  })
})
