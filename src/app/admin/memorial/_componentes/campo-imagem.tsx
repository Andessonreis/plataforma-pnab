'use client'

import { ImageUpload } from '@/components/ui'
import { MAX_BYTES_MEMORIAL, UPLOAD_MEMORIAL, type PastaUploadMemorial, megabytesMemorial } from '@/lib/memorial/midia'

interface CampoImagemProps {
  label: string
  value: string | null
  onChange: (url: string | null) => void
  pasta: PastaUploadMemorial
  hint?: string
}

/** Upload de uma imagem para o bucket do Memorial (capa, retrato, foto atual). */
export function CampoImagem({ label, value, onChange, pasta, hint }: CampoImagemProps) {
  return (
    <ImageUpload
      label={label}
      hint={hint ?? `JPG, PNG ou WEBP, até ${megabytesMemorial} MB.`}
      value={value ?? ''}
      onChange={(url) => onChange(url || null)}
      pasta={pasta}
      endpoint={UPLOAD_MEMORIAL}
      maxBytes={MAX_BYTES_MEMORIAL}
    />
  )
}
