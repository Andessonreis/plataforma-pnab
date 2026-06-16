import { Input } from '@client/components/ui'
import { formatTelefoneBR, formatCpfCnpj } from '@shared/utils/format'
import type { CadastroFormData } from './types'

interface DadosProponenteFieldsProps {
  formData: CadastroFormData
  updateField: (field: string, value: string) => void
  isCnpj: boolean
  loadingCnpj: boolean
  cnpjHint: string
  onCnpjBlur: () => void
}

export function DadosProponenteFields({
  formData,
  updateField,
  isCnpj,
  loadingCnpj,
  cnpjHint,
  onCnpjBlur,
}: DadosProponenteFieldsProps) {
  return (
    <>
      <Input
        label={isCnpj ? 'Razão Social' : 'Nome completo'}
        type="text"
        placeholder={isCnpj ? 'Razão Social da empresa' : 'Seu nome completo'}
        value={formData.nome}
        onChange={(e) => updateField('nome', e.target.value)}
        required
        autoComplete="name"
      />

      <Input
        label={isCnpj ? 'CNPJ' : 'CPF'}
        type="text"
        inputMode="numeric"
        placeholder={isCnpj ? '00.000.000/0000-00' : '000.000.000-00'}
        value={formData.cpfCnpj}
        onChange={(e) => updateField('cpfCnpj', formatCpfCnpj(e.target.value))}
        onBlur={isCnpj ? onCnpjBlur : undefined}
        maxLength={isCnpj ? 18 : 14}
        required
        autoComplete="off"
        hint={
          isCnpj
            ? loadingCnpj
              ? 'Consultando CNPJ na Receita...'
              : cnpjHint || undefined
            : undefined
        }
      />

      <Input
        label="E-mail"
        type="email"
        placeholder="seu@email.com"
        value={formData.email}
        onChange={(e) => updateField('email', e.target.value)}
        required
        autoComplete="email"
      />

      <Input
        label="Telefone"
        type="tel"
        inputMode="numeric"
        placeholder="(74) 99999-0000"
        value={formData.telefone}
        onChange={(e) => updateField('telefone', formatTelefoneBR(e.target.value))}
        maxLength={15}
        required
        autoComplete="tel"
      />
    </>
  )
}
