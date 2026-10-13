'use client'

import { useRouter } from 'next/navigation'
import type { StatusConteudo } from '@prisma/client'
import { Button, Card } from '@/components/ui'
import { TRANSICOES } from '@/lib/memorial/publicacao'
import { ROTULO_STATUS } from '@/lib/memorial/rotulos'
import { SeloStatus } from './selo-status'
import { RecadoEnvio } from './recado-envio'
import { useEnvio } from './use-envio'

const ACAO: Record<StatusConteudo, string> = {
  RASCUNHO: 'Voltar para rascunho',
  EM_REVISAO: 'Enviar para revisão',
  APROVADO: 'Aprovar',
  PUBLICADO: 'Publicar no site',
  ARQUIVADO: 'Arquivar',
}

function rotuloAcao(de: StatusConteudo, para: StatusConteudo) {
  if (de === 'PUBLICADO' && para === 'APROVADO') return 'Tirar do site'
  if (de === 'APROVADO' && para === 'EM_REVISAO') return 'Devolver para revisão'
  if (de === 'ARQUIVADO') return 'Reabrir como rascunho'
  return ACAO[para]
}

interface ControleStatusProps {
  /** Endereço do registro na API, ex.: /api/v1/memorial/exposicoes/abc */
  endpoint: string
  status: StatusConteudo
  /** O que ainda falta para publicar, calculado no servidor com a mesma regra da API. */
  pendencias: string[]
}

/** Etapa do conteúdo no fluxo editorial e os próximos passos possíveis. */
export function ControleStatus({ endpoint, status, pendencias }: ControleStatusProps) {
  const router = useRouter()
  const { enviando, recado, enviar } = useEnvio()

  async function mudar(para: StatusConteudo) {
    const ok = await enviar(`${endpoint}/status`, 'POST', { status: para }, `Agora está como "${ROTULO_STATUS[para]}".`)
    if (ok) router.refresh()
  }

  const podePublicar = TRANSICOES[status].includes('PUBLICADO')

  return (
    <Card padding="sm" className="space-y-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-base font-semibold text-slate-900">Publicação</h2>
        <SeloStatus status={status} />
      </div>

      {podePublicar && pendencias.length > 0 && (
        <p className="text-sm text-amber-800">
          Para publicar ainda falta: <strong>{pendencias.join(', ')}</strong>.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {TRANSICOES[status].map((para) => (
          <Button
            key={para}
            type="button"
            size="sm"
            variant={para === 'PUBLICADO' || para === 'APROVADO' ? 'primary' : 'outline'}
            className="min-h-[44px]"
            disabled={enviando || (para === 'PUBLICADO' && pendencias.length > 0)}
            onClick={() => mudar(para)}
          >
            {rotuloAcao(status, para)}
          </Button>
        ))}
      </div>

      <RecadoEnvio recado={recado} />
    </Card>
  )
}
