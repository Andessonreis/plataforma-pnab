// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { ResultActions } from '../result-actions'

const fetchMock = vi.fn()

function respostaOk(corpo: Record<string, unknown>) {
  return Promise.resolve({ ok: true, json: () => Promise.resolve(corpo) })
}

function abrirConfirmacao() {
  render(<ResultActions editalId="ed-1" editalStatus="AVALIACAO" temAvaliacoes />)
  fireEvent.click(screen.getByRole('button', { name: 'Publicar Resultado Preliminar' }))
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  // A tela recarrega a página depois de publicar; o teste só observa a mensagem.
  vi.stubGlobal('location', { reload: vi.fn() })
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('ResultActions — publicar o preliminar', () => {
  it('a confirmação diz o que a publicação faz e vem com o aviso por e-mail desmarcado', () => {
    abrirConfirmacao()

    expect(screen.getByText(/grava a classificação/i)).toBeTruthy()
    expect(screen.getByText(/libera a nota e o parecer/i)).toBeTruthy()
    expect((screen.getByLabelText('Avisar os proponentes por e-mail') as HTMLInputElement).checked).toBe(false)
  })

  it('confirmar sem marcar o e-mail publica sem avisar ninguém', async () => {
    fetchMock.mockReturnValue(respostaOk({ message: 'Resultado preliminar publicado com sucesso.' }))
    abrirConfirmacao()

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    const [url, opcoes] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/admin/editais/ed-1/resultados')
    expect(JSON.parse(opcoes.body)).toEqual({ fase: 'RESULTADO_PRELIMINAR', avisarPorEmail: false })
  })

  it('marcar o e-mail manda o pedido de aviso', async () => {
    fetchMock.mockReturnValue(respostaOk({ message: 'Resultado preliminar publicado com sucesso.' }))
    abrirConfirmacao()

    fireEvent.click(screen.getByLabelText('Avisar os proponentes por e-mail'))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ fase: 'RESULTADO_PRELIMINAR', avisarPorEmail: true })
  })

  it('mostra a mensagem de sucesso e os avisos do cronograma', async () => {
    fetchMock.mockReturnValue(respostaOk({
      message: 'Resultado preliminar publicado com sucesso.',
      avisos: ['O cronograma não tem o marco do período de recursos da seleção.'],
    }))
    abrirConfirmacao()

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(await screen.findByText(/publicado com sucesso\. O cronograma não tem o marco do período de recursos/)).toBeTruthy()
  })

  it('mostra o erro devolvido pelo servidor e não recarrega a página', async () => {
    fetchMock.mockReturnValue(Promise.resolve({
      ok: false, json: () => Promise.resolve({ message: 'O resultado preliminar deste edital já foi publicado.' }),
    }))
    abrirConfirmacao()

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(await screen.findByText('O resultado preliminar deste edital já foi publicado.')).toBeTruthy()
    expect(window.location.reload).not.toHaveBeenCalled()
  })

  it('cancelar fecha a confirmação sem publicar', () => {
    abrirConfirmacao()

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Publicar Resultado Preliminar' })).toBeTruthy()
  })

  it('o resultado final não oferece o aviso por e-mail nem manda o campo', async () => {
    fetchMock.mockReturnValue(respostaOk({ message: 'Resultado final publicado com sucesso.' }))
    render(<ResultActions editalId="ed-1" editalStatus="RECURSO" temAvaliacoes consolidado />)

    fireEvent.click(screen.getByRole('button', { name: 'Publicar Resultado Final' }))
    expect(screen.queryByLabelText('Avisar os proponentes por e-mail')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Publicar Final' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ fase: 'RESULTADO_FINAL' })
  })

  it('sem avaliação finalizada o botão de publicar fica bloqueado', () => {
    render(<ResultActions editalId="ed-1" editalStatus="AVALIACAO" temAvaliacoes={false} />)

    expect((screen.getByRole('button', { name: 'Publicar Resultado Preliminar' }) as HTMLButtonElement).disabled).toBe(true)
  })
})
