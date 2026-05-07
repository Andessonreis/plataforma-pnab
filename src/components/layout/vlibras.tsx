'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    VLibras: {
      Widget: new (url: string) => void
    }
  }
}

// Timeout pra detectar widget que carregou o JS mas não populou o DOM
// (CSS/imagens externas falhando, branch @dev quebrada, etc.). Sem isso
// o usuário vê um botão vazio ou ícone de imagem quebrada no canto.
const INIT_TIMEOUT_MS = 5000

/**
 * Widget VLibras — tradutor de Libras do governo federal.
 * Cria a estrutura DOM exigida pelo plugin e carrega o script no client.
 *
 * O markup usa atributos customizados (vw, vw-access-button, vw-plugin-wrapper)
 * que não existem nos tipos JSX do React, então construímos via ref.
 *
 * Fallback gracioso: se o script falhar ou o widget não popular o botão
 * dentro de INIT_TIMEOUT_MS, esconde o container — evita ícone de imagem
 * quebrada quando o serviço do gov.br está instável.
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

    // Esconde o container e evita renderizar elementos quebrados (ícone broken)
    function hideContainer() {
      if (containerRef.current) {
        containerRef.current.style.display = 'none'
      }
    }

    // Verifica se o widget realmente populou o botão de acesso. O VLibras
    // injeta uma <img> ou <svg> com o ícone quando funciona; se ficar vazio,
    // significa que CSS/assets falharam.
    function widgetInitialized(): boolean {
      const btn = containerRef.current?.querySelector('[vw-access-button]')
      if (!btn) return false
      return btn.children.length > 0
    }

    // Evita carregar o script duas vezes
    const existingScript = document.querySelector('script[src*="vlibras-plugin"]')
    if (existingScript) {
      // Script já estava carregado; ainda assim verifica se o widget pegou
      const timeoutId = window.setTimeout(() => {
        if (!widgetInitialized()) hideContainer()
      }, INIT_TIMEOUT_MS)
      return () => window.clearTimeout(timeoutId)
    }

    const script = document.createElement('script')
    script.src = 'https://vlibras.gov.br/app/vlibras-plugin.js'
    script.async = true
    script.onload = () => {
      if (window.VLibras) {
        try {
          new window.VLibras.Widget('https://vlibras.gov.br/app')
        } catch {
          hideContainer()
        }
      } else {
        hideContainer()
      }
    }
    script.onerror = hideContainer
    document.head.appendChild(script)

    // Mesmo com onload bem-sucedido, o widget pode falhar silenciosamente
    // se o gov.br retornar 503 nos assets. Verificação tardia.
    const timeoutId = window.setTimeout(() => {
      if (!widgetInitialized()) hideContainer()
    }, INIT_TIMEOUT_MS)

    return () => window.clearTimeout(timeoutId)
  }, [])

  return <div ref={containerRef} />
}

export { VLibras }
