'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    VLibras: {
      Widget: new (url: string) => void
    }
  }
}

/**
 * Widget VLibras — tradutor de Libras do governo federal.
 * Cria a estrutura DOM exigida pelo plugin e carrega o script no client.
 *
 * O markup usa atributos customizados (vw, vw-access-button, vw-plugin-wrapper)
 * que não existem nos tipos JSX do React, então construímos via ref.
 */
function VLibras() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Monta a estrutura DOM que o VLibras espera
    container.setAttribute('vw', '')
    container.classList.add('enabled')

    const accessButton = document.createElement('div')
    accessButton.setAttribute('vw-access-button', '')
    accessButton.classList.add('active')

    const pluginWrapper = document.createElement('div')
    pluginWrapper.setAttribute('vw-plugin-wrapper', '')

    const topWrapper = document.createElement('div')
    topWrapper.classList.add('vw-plugin-top-wrapper')
    pluginWrapper.appendChild(topWrapper)

    container.appendChild(accessButton)
    container.appendChild(pluginWrapper)

    // Evita carregar o script duas vezes
    if (document.querySelector('script[src*="vlibras-plugin"]')) return

    const script = document.createElement('script')
    script.src = 'https://vlibras.gov.br/app/vlibras-plugin.js'
    script.async = true
    script.onload = () => {
      if (window.VLibras) {
        new window.VLibras.Widget('https://vlibras.gov.br/app')
      }
    }
    document.head.appendChild(script)
  }, [])

  return <div ref={containerRef} />
}

export { VLibras }
