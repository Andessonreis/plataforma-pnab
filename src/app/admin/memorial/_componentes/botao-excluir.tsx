'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { RecadoEnvio } from './recado-envio'
import { useEnvio } from './use-envio'

interface BotaoExcluirProps {
  endpoint: string
  nome: string
  /** Para onde ir depois de excluir. */
  destino: string
  aviso?: string
}

export function BotaoExcluir({ endpoint, nome, destino, aviso }: BotaoExcluirProps) {
  const router = useRouter()
  const { enviando, recado, enviar } = useEnvio()

  async function excluir() {
    const texto = `Excluir "${nome}"? ${aviso ?? 'Esta ação não pode ser desfeita.'}`
    if (!window.confirm(texto)) return
    if (await enviar(endpoint, 'DELETE')) {
      router.push(destino)
      router.refresh()
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="danger" size="sm" className="min-h-[44px]" loading={enviando} onClick={excluir}>
        Excluir
      </Button>
      <RecadoEnvio recado={recado} />
    </div>
  )
}
