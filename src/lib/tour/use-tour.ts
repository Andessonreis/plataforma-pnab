'use client'

import { driver, type DriveStep } from 'driver.js'
import 'driver.js/dist/driver.css'
import './tour.css'

export interface TourStep {
  /** Seletor CSS do elemento a destacar. */
  elemento: string
  titulo: string
  descricao: string
  /** Passo só existe em telas < 1024px (ex.: o botão de abrir o menu, que some no desktop). */
  soMobile?: boolean
}

const LARGURA_DESKTOP = 1024

/**
 * Tour guiado reutilizável — qualquer página chama `iniciarTour(passos)` com
 * uma lista de `{ elemento, titulo, descricao }` apontando pra ids/seletores
 * já presentes na tela. Não tem estado de tela própria: cada chamada monta
 * e destrói sua própria instância do driver.js.
 */
export function iniciarTour(passos: TourStep[]): void {
  const steps: DriveStep[] = passos.map(({ elemento, titulo, descricao, soMobile }) => ({
    element: soMobile
      ? () => (window.innerWidth < LARGURA_DESKTOP ? (document.querySelector(elemento) as Element) : undefined!)
      : elemento,
    popover: { title: titulo, description: descricao },
  }))

  const instancia = driver({
    steps,
    showProgress: false,
    allowClose: true,
    skipMissingElement: true,
    stagePadding: 6,
    stageRadius: 8,
    popoverClass: 'tour-secult',
    prevBtnText: 'Anterior',
    nextBtnText: 'Próximo',
    doneBtnText: 'Concluir',
    onHighlightStarted: (element) => {
      // No mobile a sidebar fica escondida por padrão — abre ela sozinha
      // quando o passo aponta pra um item do menu, senão o destaque cai
      // num elemento fora da tela.
      const toggle = document.getElementById('sidebar-toggle')
      if (toggle instanceof HTMLInputElement) {
        toggle.checked = element?.id?.startsWith('tour-nav-') ?? false
      }
    },
    onDestroyed: () => {
      const toggle = document.getElementById('sidebar-toggle')
      if (toggle instanceof HTMLInputElement) toggle.checked = false
    },
    onPopoverRender: (popover) => {
      // "Pular" ao lado dos botões — mesmo texto do vídeo de referência, não só o × de fechar.
      const pular = document.createElement('button')
      pular.textContent = 'Pular'
      pular.type = 'button'
      pular.className = 'tour-secult-pular'
      pular.addEventListener('click', () => instancia.destroy())
      popover.footerButtons.prepend(pular)

      // "Concluir" no último passo não dispara onDestroyed de forma confiável
      // (é o mesmo botão "next", só relabelado) — sem isto a sidebar ficava
      // aberta depois do tour terminar no mobile. O timeout roda depois de
      // qualquer coisa que o driver.js faça internamente no mesmo clique.
      popover.nextButton.addEventListener('click', () => {
        if (instancia.isLastStep()) {
          setTimeout(() => {
            const toggle = document.getElementById('sidebar-toggle')
            if (toggle instanceof HTMLInputElement) toggle.checked = false
          }, 0)
        }
      })
    },
  })

  instancia.drive()
}
