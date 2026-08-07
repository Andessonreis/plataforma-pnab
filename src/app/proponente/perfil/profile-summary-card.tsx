import type { ChangeEvent } from 'react'
import { Badge } from '@/components/ui'
import { AvatarSection } from './avatar-section'

const TIPO_LABELS: Record<string, string> = {
  PF: 'Pessoa Física',
  PJ: 'Pessoa Jurídica',
  MEI: 'Microempreendedor Individual',
  COLETIVO: 'Coletivo / Grupo',
}

interface ProfileHeaderProps {
  nome: string
  email: string
  avatarUrl: string | null
  avatarBusy: boolean
  onAvatarUpload: (e: ChangeEvent<HTMLInputElement>) => void
  onAvatarRemove: () => void
  tipoProponente: string | null
  cpfCnpj: string | null
  telefone: string | null
  logradouro: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  uf: string | null
  cep: string | null
  createdAt: Date
}

/** Cabeçalho de perfil — foto, identidade e metadados num único painel, sem
 * card aninhado. Os campos de identidade refletem o estado atual do
 * formulário de dados pessoais (mesma fonte de dados, sem duplicar estado). */
export function ProfileHeader({
  nome, email, avatarUrl, avatarBusy, onAvatarUpload, onAvatarRemove,
  tipoProponente, cpfCnpj, telefone, logradouro, numero, complemento, bairro, cidade, uf, cep, createdAt,
}: ProfileHeaderProps) {
  const enderecoCompleto = logradouro
    ? `${logradouro}${numero ? `, ${numero}` : ''}${complemento ? ` — ${complemento}` : ''} — ${bairro} — ${cidade}/${uf}`
    : null

  return (
    // deslop-ignore-next-line 21 — painel isolado, sem raio maior aninhado dentro dele; o único outro raio do bloco é o círculo do avatar/badge
    <div id="tour-perfil-resumo" className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:gap-6 sm:text-left">
        <AvatarSection
          nome={nome}
          avatarUrl={avatarUrl}
          avatarBusy={avatarBusy}
          onUpload={onAvatarUpload}
          onRemove={onAvatarRemove}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 sm:justify-start">
            <h2 className="text-xl font-semibold text-slate-900">{nome || 'Sem nome'}</h2>
            <Badge variant="success">{TIPO_LABELS[tipoProponente ?? ''] ?? 'Proponente'}</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">{email}</p>

          {/* deslop-ignore-next-line 28 — lista de definição (metadado real: CPF, telefone, data), não grade de cartões decorativos */}
          <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 border-t border-slate-100 pt-4 sm:mt-5 sm:gap-y-4 sm:pt-5 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-slate-500">CPF/CNPJ</dt>
              {/* deslop-ignore-next-line 34 — mono só no identificador (CPF/CNPJ), não na UI inteira */}
              <dd className="mt-0.5 font-mono text-sm text-slate-900">{cpfCnpj ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Telefone</dt>
              <dd className="mt-0.5 text-sm text-slate-900">{telefone || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Membro desde</dt>
              <dd className="mt-0.5 text-sm text-slate-900">
                {createdAt.toLocaleDateString('pt-BR', {
                  month: 'long',
                  year: 'numeric',
                  timeZone: 'America/Sao_Paulo',
                })}
              </dd>
            </div>
            {enderecoCompleto && (
              <div className="sm:col-span-3">
                <dt className="text-xs text-slate-500">Endereço</dt>
                <dd className="mt-0.5 text-sm text-slate-900">
                  {enderecoCompleto}
                  {cep ? ` — ${cep}` : ''}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  )
}
