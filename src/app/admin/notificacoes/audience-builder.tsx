'use client'

import { useState } from 'react'
import type { AudienceFilterInput } from '@/lib/notifications/schemas'
import { Card, Textarea } from '@/components/ui'

export interface EditalOption {
  id: string
  titulo: string
}

interface AudienceBuilderProps {
  value: AudienceFilterInput
  onChange: (value: AudienceFilterInput) => void
  editais: EditalOption[]
}

const STATUS_INSCRICAO = [
  'RASCUNHO',
  'ENVIADA',
  'HABILITADA',
  'INABILITADA',
  'EM_AVALIACAO',
  'CONTEMPLADA',
  'NAO_CONTEMPLADA',
  'SUPLENTE',
] as const

const TIPOS_PROPONENTE = ['PF', 'MEI', 'PJ', 'COLETIVO'] as const

export function AudienceBuilder({ value, onChange, editais }: AudienceBuilderProps) {
  const [editaisLocal, setEditaisLocal] = useState<string[]>(value.editais ?? [])
  const [statusLocal, setStatusLocal] = useState<string[]>(value.inscricaoStatus ?? [])
  const [tiposLocal, setTiposLocal] = useState<string[]>(value.tipoProponente ?? [])
  const [semInscricao, setSemInscricao] = useState<boolean>(value.semInscricao ?? false)
  const [semInscricaoNoEdital, setSemInscricaoNoEdital] = useState<string>(
    value.semInscricaoNoEdital ?? '',
  )
  const [userIdsText, setUserIdsText] = useState<string>((value.userIds ?? []).join('\n'))
  const [emailsText, setEmailsText] = useState<string>((value.emails ?? []).join('\n'))

  function emit(next: Partial<AudienceFilterInput>) {
    const merged: AudienceFilterInput = {
      ...(editaisLocal.length > 0 ? { editais: editaisLocal } : {}),
      ...(statusLocal.length > 0
        ? { inscricaoStatus: statusLocal as AudienceFilterInput['inscricaoStatus'] }
        : {}),
      ...(tiposLocal.length > 0
        ? { tipoProponente: tiposLocal as AudienceFilterInput['tipoProponente'] }
        : {}),
      ...(semInscricao ? { semInscricao: true } : {}),
      ...(semInscricaoNoEdital ? { semInscricaoNoEdital } : {}),
      ...(userIdsText.trim()
        ? {
            userIds: userIdsText
              .split(/\s+/)
              .map((s) => s.trim())
              .filter(Boolean),
          }
        : {}),
      ...(emailsText.trim()
        ? {
            emails: emailsText
              .split(/\s+/)
              .map((s) => s.trim())
              .filter(Boolean),
          }
        : {}),
      ...next,
    }
    onChange(merged)
  }

  function toggleEdital(id: string) {
    const next = editaisLocal.includes(id)
      ? editaisLocal.filter((x) => x !== id)
      : [...editaisLocal, id]
    setEditaisLocal(next)
    emit({ editais: next.length > 0 ? next : undefined })
  }

  function toggleStatus(s: string) {
    const next = statusLocal.includes(s) ? statusLocal.filter((x) => x !== s) : [...statusLocal, s]
    setStatusLocal(next)
    emit({
      inscricaoStatus:
        next.length > 0 ? (next as AudienceFilterInput['inscricaoStatus']) : undefined,
    })
  }

  function toggleTipo(t: string) {
    const next = tiposLocal.includes(t) ? tiposLocal.filter((x) => x !== t) : [...tiposLocal, t]
    setTiposLocal(next)
    emit({
      tipoProponente:
        next.length > 0 ? (next as AudienceFilterInput['tipoProponente']) : undefined,
    })
  }

  return (
    <Card padding="sm" className="sm:p-6 space-y-5">
      <div>
        <h3 className="text-base font-semibold text-slate-900 mb-1">Audiência</h3>
        <p className="text-xs text-slate-500">
          Os filtros são combinados por <strong>UNIÃO</strong> — quem se encaixar em qualquer uma das
          opções recebe a notificação. Deixar tudo vazio = nenhum destinatário.
        </p>
      </div>

      {/* Editais */}
      <div>
        <p className="text-sm font-medium text-slate-700 mb-2">Editais</p>
        {editais.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Nenhum edital disponível.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {editais.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => toggleEdital(e.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors min-h-[36px] inline-flex items-center ${
                  editaisLocal.includes(e.id)
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {e.titulo}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Status de inscrição */}
      {editaisLocal.length > 0 && (
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">
            Status da inscrição{' '}
            <span className="text-xs font-normal text-slate-500">(opcional — filtra os editais acima)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {STATUS_INSCRICAO.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleStatus(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors min-h-[36px] inline-flex items-center ${
                  statusLocal.includes(s)
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tipo de proponente */}
      <div>
        <p className="text-sm font-medium text-slate-700 mb-2">Tipo de proponente</p>
        <div className="flex flex-wrap gap-2">
          {TIPOS_PROPONENTE.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggleTipo(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors min-h-[36px] inline-flex items-center ${
                tiposLocal.includes(t)
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Sem inscrição */}
      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
          <input
            type="checkbox"
            checked={semInscricao}
            onChange={(e) => {
              setSemInscricao(e.target.checked)
              emit({ semInscricao: e.target.checked || undefined })
            }}
            className="h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm font-medium text-slate-700">
            Usuários que nunca se inscreveram em nenhum edital
          </span>
        </label>

        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">
            Usuários sem inscrição em um edital específico
          </p>
          <select
            value={semInscricaoNoEdital}
            onChange={(e) => {
              setSemInscricaoNoEdital(e.target.value)
              emit({ semInscricaoNoEdital: e.target.value || undefined })
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">— Nenhum —</option>
            {editais.map((e) => (
              <option key={e.id} value={e.id}>
                {e.titulo}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Listas manuais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Textarea
          label="IDs de usuário"
          value={userIdsText}
          onChange={(e) => {
            setUserIdsText(e.target.value)
            const ids = e.target.value
              .split(/\s+/)
              .map((s) => s.trim())
              .filter(Boolean)
            emit({ userIds: ids.length > 0 ? ids : undefined })
          }}
          placeholder="Um ID por linha (cuid)"
          hint="Adicionados à audiência (UNIÃO)"
          rows={4}
        />
        <Textarea
          label="Emails"
          value={emailsText}
          onChange={(e) => {
            setEmailsText(e.target.value)
            const emails = e.target.value
              .split(/\s+/)
              .map((s) => s.trim())
              .filter(Boolean)
            emit({ emails: emails.length > 0 ? emails : undefined })
          }}
          placeholder="Um email por linha"
          hint="Emails sem usuário válido são ignorados"
          rows={4}
        />
      </div>
    </Card>
  )
}
