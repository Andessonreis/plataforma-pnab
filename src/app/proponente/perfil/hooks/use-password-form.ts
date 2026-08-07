'use client'

import { useState, type FormEvent } from 'react'

type FormMessage = { type: 'success' | 'error'; text: string }

/** Estado e submissão da troca de senha — PUT separado do de dados pessoais
 * (o backend distingue os dois payloads pela presença de currentPassword). */
export function usePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<FormMessage | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setMessage(null)

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem.' })
      return
    }

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'A nova senha deve ter no mínimo 8 caracteres.' })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/proponente/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage({ type: 'error', text: data.message || 'Erro ao alterar senha.' })
        return
      }

      setMessage({ type: 'success', text: 'Senha alterada com sucesso.' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      setMessage({ type: 'error', text: 'Erro de conexão. Tente novamente.' })
    } finally {
      setLoading(false)
    }
  }

  return {
    currentPassword,
    newPassword,
    confirmPassword,
    setCurrentPassword,
    setNewPassword,
    setConfirmPassword,
    loading,
    message,
    handleSubmit,
  }
}
