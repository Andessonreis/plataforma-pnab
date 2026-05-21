// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { CollapsibleSection } from '../collapsible-section'

afterEach(cleanup)

describe('CollapsibleSection', () => {
  it('renderiza título, subtítulo e conteúdo', () => {
    render(
      <CollapsibleSection title="Proponente" subtitle="Dados pessoais">
        <p>conteúdo interno</p>
      </CollapsibleSection>,
    )
    expect(screen.getByRole('button', { name: /Proponente/i })).toBeTruthy()
    expect(screen.getByText('Dados pessoais')).toBeTruthy()
    expect(screen.getByText('conteúdo interno')).toBeTruthy()
  })

  it('começa aberto por default e conteúdo é visível', () => {
    render(
      <CollapsibleSection title="Seção">
        <p>corpo</p>
      </CollapsibleSection>,
    )
    const btn = screen.getByRole('button', { name: /Seção/i })
    expect(btn.getAttribute('aria-expanded')).toBe('true')
    // hidden=false → não tem atributo hidden
    const corpo = screen.getByText('corpo')
    expect(corpo.closest('[hidden]')).toBeNull()
  })

  it('respeita defaultOpen=false (começa fechado)', () => {
    render(
      <CollapsibleSection title="Seção" defaultOpen={false}>
        <p>corpo</p>
      </CollapsibleSection>,
    )
    const btn = screen.getByRole('button', { name: /Seção/i })
    expect(btn.getAttribute('aria-expanded')).toBe('false')
    const corpo = screen.getByText('corpo')
    expect(corpo.closest('[hidden]')).not.toBeNull()
  })

  it('click no header alterna aria-expanded', () => {
    render(
      <CollapsibleSection title="Seção">
        <p>corpo</p>
      </CollapsibleSection>,
    )
    const btn = screen.getByRole('button', { name: /Seção/i })
    expect(btn.getAttribute('aria-expanded')).toBe('true')

    fireEvent.click(btn)
    expect(btn.getAttribute('aria-expanded')).toBe('false')

    fireEvent.click(btn)
    expect(btn.getAttribute('aria-expanded')).toBe('true')
  })

  it('Enter e Espaço também alternam (acessibilidade de teclado)', () => {
    render(
      <CollapsibleSection title="Seção" defaultOpen={false}>
        <p>corpo</p>
      </CollapsibleSection>,
    )
    const btn = screen.getByRole('button', { name: /Seção/i })
    expect(btn.getAttribute('aria-expanded')).toBe('false')

    fireEvent.keyDown(btn, { key: 'Enter' })
    expect(btn.getAttribute('aria-expanded')).toBe('true')

    fireEvent.keyDown(btn, { key: ' ' })
    expect(btn.getAttribute('aria-expanded')).toBe('false')
  })

  it('aria-controls aponta para o id do container do conteúdo', () => {
    render(
      <CollapsibleSection title="Seção">
        <p>corpo-teste</p>
      </CollapsibleSection>,
    )
    const btn = screen.getByRole('button', { name: /Seção/i })
    const controlsId = btn.getAttribute('aria-controls')
    expect(controlsId).toBeTruthy()
    const container = document.getElementById(controlsId!)
    expect(container).not.toBeNull()
    expect(container!.textContent).toContain('corpo-teste')
  })

  it('renderiza badge quando fornecido', () => {
    render(
      <CollapsibleSection title="Anexos" badge={<span>42</span>}>
        <p>lista</p>
      </CollapsibleSection>,
    )
    expect(screen.getByText('42')).toBeTruthy()
  })
})
