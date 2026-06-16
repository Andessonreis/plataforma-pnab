import { Input, Button, Card } from '@client/components/ui'
import { formatTelefoneBR } from '@shared/utils/format'
import type { DadosPessoaisSectionProps } from './types'

export function DadosPessoaisSection({
  nome,
  setNome,
  email,
  setEmail,
  telefone,
  setTelefone,
  errors,
  message,
  loading,
  onSubmit,
  children,
}: DadosPessoaisSectionProps) {
  return (
    <Card>
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Dados Pessoais</h2>

      {message && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-brand-50 text-brand-800 border border-brand-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
          role="alert"
        >
          {message.text}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Nome completo"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          error={errors.nome}
          required
        />
        <Input
          label="E-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          required
        />
        <Input
          label="Telefone"
          type="tel"
          inputMode="numeric"
          value={telefone}
          onChange={(e) => setTelefone(formatTelefoneBR(e.target.value))}
          error={errors.telefone}
          hint="Com DDD. Ex: (77) 99999-0000"
          maxLength={15}
        />

        {children}

        <div className="flex justify-end">
          <Button type="submit" loading={loading}>
            Salvar Alterações
          </Button>
        </div>
      </form>
    </Card>
  )
}
