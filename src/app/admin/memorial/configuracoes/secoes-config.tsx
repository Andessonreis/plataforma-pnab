'use client'

import { useState, type ReactNode } from 'react'
import { AbasBotao } from '@/app/admin/memorial/_ui/config-abas'

export interface Secao {
  chave: string
  rotulo: string
  conteudo: ReactNode
}

/**
 * Uma seção por vez. As outras ficam montadas e só escondidas, para que o que
 * foi digitado e ainda não salvo não se perca ao trocar de aba. A aba aberta
 * vai para o endereço, então o link pode ser enviado para outra pessoa.
 */
export function SecoesConfig({ secoes, inicial }: { secoes: Secao[]; inicial: string }) {
  const [aberta, setAberta] = useState(inicial)

  function abrir(chave: string) {
    setAberta(chave)
    const url = new URL(window.location.href)
    url.searchParams.set('secao', chave)
    window.history.replaceState(null, '', url)
  }

  return (
    <>
      <AbasBotao rotulo="Partes da configuração" abas={secoes} ativa={aberta} onChange={abrir} className="mb-6" />
      {secoes.map((s) => (
        <div key={s.chave} role="tabpanel" aria-label={s.rotulo} hidden={s.chave !== aberta}>
          {s.conteudo}
        </div>
      ))}
    </>
  )
}
