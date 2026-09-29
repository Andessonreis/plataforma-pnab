import { describe, expect, it } from 'vitest'
import { parecerParaProponente } from '../parecer-proponente'

describe('parecerParaProponente', () => {
  it('remove a linha em que o avaliador se identifica', () => {
    const parecer = 'Avaliadora: Fulana de Tal (Banca Avaliadora)\n\nTrajetória comprovada.'
    expect(parecerParaProponente(parecer)).toBe('Trajetória comprovada.')
  })

  it('remove a identificação no meio do texto, com ou sem acento de gênero', () => {
    const parecer = 'Inscrição: PNAB-1\nAvaliador(a): Fulano\nNota justa.'
    expect(parecerParaProponente(parecer)).toBe('Inscrição: PNAB-1\nNota justa.')
  })

  it('mantém frases que só mencionam a banca avaliadora', () => {
    const parecer = 'Como avaliadora técnica, inicio esta análise.'
    expect(parecerParaProponente(parecer)).toBe(parecer)
  })
})
