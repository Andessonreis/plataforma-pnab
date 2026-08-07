'use client'

import { MAX_VIDEO_SIZE_MB } from '@/lib/upload/anexo-config'
import type { EtapaCustomizada } from '@/types/etapa-customizada'

// Instruções de gravação exibidas quando o proponente opta por substituir as etapas por vídeo.
export function VideoStepInstructions({ etapasCustomizadas }: { etapasCustomizadas: EtapaCustomizada[] }) {
  const titulosEtapas = etapasCustomizadas.map((e) => e.titulo)

  return (
    <div className="rounded-lg border border-brand-100 bg-brand-50 p-4 text-sm text-slate-600">
      <p className="font-semibold text-slate-900 mb-2">Como gravar o vídeo</p>
      <p className="mb-2">
        No vídeo, apresente-se e fale sobre o seu projeto cobrindo os mesmos pontos que seriam preenchidos
        {titulosEtapas.length > 0 ? ' nestas etapas:' : ' no formulário.'}
      </p>
      {titulosEtapas.length > 0 && (
        <ul className="list-disc list-inside space-y-1 mb-2">
          {etapasCustomizadas.map((etapa) => (
            <li key={etapa.id}>
              <span className="font-medium">{etapa.titulo}</span>
              {etapa.descricao && <span className="text-slate-600"> — {etapa.descricao}</span>}
            </li>
          ))}
        </ul>
      )}
      <p className="text-slate-600">
        Grave em local com boa iluminação e áudio claro, fale de forma objetiva e evite ultrapassar {MAX_VIDEO_SIZE_MB}MB
        de arquivo (equivalente a poucos minutos de vídeo em boa qualidade). Você pode enviar o arquivo
        diretamente ou colar o link de um vídeo já hospedado (Google Drive, YouTube etc.).
      </p>
    </div>
  )
}
